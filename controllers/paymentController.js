const { Payment, Order, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// Helper function to generate unique transaction ID for cash payments
const generateTransactionId = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CASH-${timestamp.slice(-6)}-${random}`;
};

// Helper function to send payment confirmation email
const sendPaymentConfirmationEmail = async (payment, order, customer) => {
  try {
    const subject = `💰 Payment Confirmation - Order #${order.orderNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">💰 FUDO Payment Confirmation</h2>
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Payment Details</h3>
          <p><strong>Order:</strong> #${order.orderNumber}</p>
          <p><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</p>
          <p><strong>Payment Method:</strong> ${payment.paymentMethod.toUpperCase()}</p>
          <p><strong>Amount:</strong> $${payment.amount}</p>
          <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
          ${payment.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.transactionId}</p>` : ''}
          ${payment.paidAt ? `<p><strong>Paid At:</strong> ${new Date(payment.paidAt).toLocaleString()}</p>` : ''}
        </div>
        <p>Thank you for your payment! Your order is being processed.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">FUDO Food Delivery Service</p>
      </div>
    `;
    
    await emailService.sendEmail(customer.email, subject, html);
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    throw error;
  }
};

// Create payment record
const createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      orderId,
      paymentMethod = 'cash',
      amount,
      transactionId, // Optional for future digital payments
      paymentGateway // Optional for future digital payments
    } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    // Verify order exists and belongs to user (for customers) or accessible by staff/admin
    const whereCondition = { id: orderId };
    if (req.user.role === 'customer') {
      whereCondition.customerId = req.user.id;
    }

    const order = await Order.findOne({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({
      where: { orderId },
      transaction
    });

    if (existingPayment) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this order'
      });
    }

    // Validate amount matches order total
    if (parseFloat(amount) !== parseFloat(order.total)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${amount}) does not match order total ($${order.total})`
      });
    }

    // Generate transaction ID for cash payments if not provided
    let finalTransactionId = transactionId;
    if (paymentMethod === 'cash' && !transactionId) {
      finalTransactionId = generateTransactionId();
    }

    // Create payment record
    const payment = await Payment.create({
      orderId,
      paymentMethod,
      amount,
      status: paymentMethod === 'cash' ? 'completed' : 'pending', // Cash payments are immediately completed
      transactionId: finalTransactionId,
      paymentGateway,
      paidAt: paymentMethod === 'cash' ? new Date() : null
    }, { transaction });

    // Update order status if payment is completed
    if (payment.status === 'completed') {
      await Order.update(
        { status: 'confirmed' },
        { 
          where: { id: orderId },
          transaction 
        }
      );
    }

    await transaction.commit();

    // Send payment confirmation email
    try {
      await sendPaymentConfirmationEmail(payment, order, order.customer);
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
      // Don't fail the payment if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        id: payment.id,
        orderId: payment.orderId,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment'
    });
  }
};

// Get payment by order ID
const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verify order access
    const whereCondition = { id: orderId };
    if (req.user.role === 'customer') {
      whereCondition.customerId = req.user.id;
    }

    const order = await Order.findOne({ where: whereCondition });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    const payment = await Payment.findOne({
      where: { orderId },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total'],
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found for this order'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment'
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'customerId'],
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'customer' && payment.order.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment'
    });
  }
};

// Get all payments (Staff/Admin only)
const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Filter by status
    if (status) {
      whereConditions.status = status;
    }

    // Filter by payment method
    if (paymentMethod) {
      whereConditions.paymentMethod = paymentMethod;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) {
        whereConditions.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereConditions.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const payments = await Payment.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total'],
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: payments.count,
      totalPages: Math.ceil(payments.count / limit),
      currentPage: parseInt(page),
      data: payments.rows
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, paidAt, refundedAt, refundAmount } = req.body;

    if (!status) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        }
      ],
      transaction
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Prepare update data
    const updateData = { status };
    
    if (status === 'completed' && !payment.paidAt) {
      updateData.paidAt = paidAt || new Date();
    }
    
    if (status === 'refunded') {
      updateData.refundedAt = refundedAt || new Date();
      if (refundAmount) {
        updateData.refundAmount = refundAmount;
      }
    }

    // Update payment
    await Payment.update(updateData, {
      where: { id },
      transaction
    });

    // Update order status based on payment status
    if (status === 'completed') {
      await Order.update(
        { status: 'confirmed' },
        { 
          where: { id: payment.orderId },
          transaction 
        }
      );
    } else if (status === 'failed') {
      await Order.update(
        { status: 'cancelled' },
        { 
          where: { id: payment.orderId },
          transaction 
        }
      );
    }

    await transaction.commit();

    // Fetch updated payment
    const updatedPayment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedPayment
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status'
    });
  }
};

// Process refund
const processRefund = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { refundAmount, reason } = req.body;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        }
      ],
      transaction
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    const finalRefundAmount = refundAmount || payment.amount;

    // Update payment with refund information
    await Payment.update({
      status: 'refunded',
      refundedAt: new Date(),
      refundAmount: finalRefundAmount
    }, {
      where: { id },
      transaction
    });

    // Update order status
    await Order.update(
      { status: 'cancelled' },
      { 
        where: { id: payment.orderId },
        transaction 
      }
    );

    await transaction.commit();

    // Send refund notification email
    try {
      const subject = `💸 Refund Processed - Order #${payment.order.orderNumber}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">💸 FUDO Refund Notification</h2>
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Refund Details</h3>
            <p><strong>Order:</strong> #${payment.order.orderNumber}</p>
            <p><strong>Original Amount:</strong> $${payment.amount}</p>
            <p><strong>Refund Amount:</strong> $${finalRefundAmount}</p>
            <p><strong>Payment Method:</strong> ${payment.paymentMethod.toUpperCase()}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p>Your refund has been processed successfully. For cash payments, please contact our customer service for collection details.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">FUDO Food Delivery Service</p>
        </div>
      `;
      
      await emailService.sendEmail(payment.order.customer.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send refund notification email:', emailError);
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        refundAmount: finalRefundAmount,
        refundedAt: new Date(),
        reason
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund'
    });
  }
};

// Get payment statistics
const getPaymentStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereConditions = {};
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) {
        whereConditions.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereConditions.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // Overall statistics
    const totalPayments = await Payment.count({ where: whereConditions });
    const completedPayments = await Payment.count({ 
      where: { ...whereConditions, status: 'completed' } 
    });
    const pendingPayments = await Payment.count({ 
      where: { ...whereConditions, status: 'pending' } 
    });
    const failedPayments = await Payment.count({ 
      where: { ...whereConditions, status: 'failed' } 
    });
    const refundedPayments = await Payment.count({ 
      where: { ...whereConditions, status: 'refunded' } 
    });

    // Revenue statistics
    const totalRevenue = await Payment.sum('amount', { 
      where: { ...whereConditions, status: 'completed' } 
    }) || 0;
    
    const totalRefunds = await Payment.sum('refundAmount', { 
      where: { ...whereConditions, status: 'refunded' } 
    }) || 0;

    // Payment method breakdown
    const paymentMethodStats = await Payment.findAll({
      where: { ...whereConditions, status: 'completed' },
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['paymentMethod']
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalPayments,
          completedPayments,
          pendingPayments,
          failedPayments,
          refundedPayments,
          completionRate: totalPayments > 0 ? ((completedPayments / totalPayments) * 100).toFixed(2) + '%' : '0%'
        },
        revenue: {
          totalRevenue: parseFloat(totalRevenue).toFixed(2),
          totalRefunds: parseFloat(totalRefunds).toFixed(2),
          netRevenue: (parseFloat(totalRevenue) - parseFloat(totalRefunds)).toFixed(2)
        },
        paymentMethods: paymentMethodStats.map(stat => ({
          method: stat.paymentMethod,
          count: parseInt(stat.dataValues.count),
          total: parseFloat(stat.dataValues.total || 0).toFixed(2)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics'
    });
  }
};

module.exports = {
  createPayment,
  getPaymentByOrderId,
  getPaymentById,
  getAllPayments,
  updatePaymentStatus,
  processRefund,
  getPaymentStatistics
};
