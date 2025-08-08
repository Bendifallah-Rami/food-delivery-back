const { Order, OrderItem, MenuItem, User, UserAddress, Category, Stock, sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');

// Helper function to generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-6)}-${random}`;
};

// Helper function to calculate order totals
const calculateOrderTotals = (orderItems, deliveryFee = 0, taxRate = 0.1) => {
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) * item.quantity);
  }, 0);
  
  const tax = subtotal * taxRate;
  const total = subtotal + tax + deliveryFee;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    deliveryFee: parseFloat(deliveryFee),
    total: parseFloat(total.toFixed(2))
  };
};

// Helper function to send order confirmation email
const sendOrderConfirmationEmail = async (order, customer) => {
  try {
    const subject = `🍕 Order Confirmation #${order.orderNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🍕 FUDO Order Confirmation</h2>
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Order #${order.orderNumber}</h3>
          <p><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Order Type:</strong> ${order.orderType}</p>
          <p><strong>Total:</strong> $${order.total}</p>
          ${order.estimatedDeliveryTime ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryTime).toLocaleString()}</p>` : ''}
        </div>
        <p>Thank you for your order! We'll keep you updated on your order status.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">FUDO Food Delivery Service</p>
      </div>
    `;
    
    await emailService.sendEmail(customer.email, subject, html);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

// Helper function to send order status update email
const sendOrderStatusUpdateEmail = async (order, customer, previousStatus) => {
  try {
    const statusMessages = {
      'confirmed': '✅ Your order has been confirmed and is being prepared',
      'preparing': '👨‍🍳 Your order is now being prepared in the kitchen',
      'ready': '📦 Your order is ready for pickup/delivery',
      'out_for_delivery': '🚗 Your order is out for delivery',
      'delivered': '🎉 Your order has been delivered successfully',
      'cancelled': '❌ Your order has been cancelled'
    };

    const subject = `📱 Order Update #${order.orderNumber} - ${order.status.toUpperCase()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">📱 Order Status Update</h2>
        <div style="background-color: #e8f4f8; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Order #${order.orderNumber}</h3>
          <p><strong>Status Update:</strong> ${statusMessages[order.status] || order.status}</p>
          <p><strong>Previous Status:</strong> ${previousStatus}</p>
          <p><strong>Current Status:</strong> ${order.status}</p>
          ${order.estimatedDeliveryTime ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryTime).toLocaleString()}</p>` : ''}
        </div>
        <p>Thank you for choosing FUDO!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">FUDO Food Delivery Service</p>
      </div>
    `;
    
    await emailService.sendEmail(customer.email, subject, html);
  } catch (error) {
    console.error('Error sending order status update email:', error);
  }
};

// Get all orders with filtering and pagination (Admin/Staff only)
const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      orderType,
      customerId,
      startDate,
      endDate,
      search
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Filter by status
    if (status) {
      whereConditions.status = status;
    }

    // Filter by order type
    if (orderType) {
      whereConditions.orderType = orderType;
    }

    // Filter by customer
    if (customerId) {
      whereConditions.customerId = customerId;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.createdAt[Op.lte] = new Date(endDate);
    }

    // Search by order number
    if (search) {
      whereConditions.orderNumber = { [Op.iLike]: `%${search}%` };
    }

    const orders = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: UserAddress,
          as: 'deliveryAddress',
          attributes: ['id', 'street', 'city', 'state', 'zipCode']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'price'],
              include: [
                {
                  model: Category,
                  as: 'category',
                  attributes: ['id', 'name']
                }
              ]
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
      count: orders.count,
      totalPages: Math.ceil(orders.count / limit),
      currentPage: parseInt(page),
      data: orders.rows
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: UserAddress,
          as: 'deliveryAddress',
          attributes: ['id', 'street', 'city', 'state', 'zipCode']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'price', 'image'],
              include: [
                {
                  model: Category,
                  as: 'category',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user can access this order (customer can only see their own orders)
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
};

// Get current user's orders (Customer only)
const getMyOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereConditions = { customerId: req.user.id };

    if (status) {
      whereConditions.status = status;
    }

    const orders = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: UserAddress,
          as: 'deliveryAddress',
          attributes: ['id', 'street', 'city', 'state', 'zipCode']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'price', 'image']
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
      count: orders.count,
      totalPages: Math.ceil(orders.count / limit),
      currentPage: parseInt(page),
      data: orders.rows
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your orders'
    });
  }
};

// Create new order (Customer only)
const createOrder = async (req, res) => {
  let transaction;
  
  try {
    const {
      orderItems,
      orderType = 'delivery',
      deliveryAddressId,
      specialInstructions,
      estimatedDeliveryTime
    } = req.body;

    // Validate required fields
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    // Validate delivery address for delivery orders
    if (orderType === 'delivery' && !deliveryAddressId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required for delivery orders'
      });
    }

    // Check if delivery address belongs to the user
    if (deliveryAddressId) {
      const address = await UserAddress.findOne({
        where: { id: deliveryAddressId, userId: req.user.id }
      });
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Delivery address not found or does not belong to you'
        });
      }
    }

    // Validate and prepare order items
    const validatedOrderItems = [];
    let stockErrors = [];

    for (const item of orderItems) {
      const { menuItemId, quantity, specialInstructions } = item;

      if (!menuItemId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must have a valid menuItemId and quantity'
        });
      }

      // Get menu item details
      const menuItem = await MenuItem.findByPk(menuItemId, {
        include: [
          {
            model: Stock,
            as: 'stock',
            attributes: ['currentStock', 'unit']
          }
        ]
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item with ID ${menuItemId} not found`
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu item "${menuItem.name}" is currently not available`
        });
      }

      // Check stock availability
      const stockRecord = menuItem.stock && menuItem.stock.length > 0 ? menuItem.stock[0] : null;
      if (stockRecord && stockRecord.currentStock < quantity) {
        stockErrors.push({
          menuItemId,
          menuItemName: menuItem.name,
          requestedQuantity: quantity,
          availableStock: stockRecord.currentStock
        });
      }

      validatedOrderItems.push({
        menuItemId,
        quantity,
        unitPrice: menuItem.price,
        totalPrice: parseFloat(menuItem.price) * quantity,
        specialInstructions
      });
    }

    // If there are stock errors, return them
    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for some items',
        stockErrors
      });
    }

    // Start transaction after all validations pass
    transaction = await sequelize.transaction();

    // Calculate order totals
    const deliveryFee = orderType === 'delivery' ? 5.00 : 0;
    const totals = calculateOrderTotals(validatedOrderItems, deliveryFee);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Calculate estimated delivery time (default 30-45 minutes)
    let estimatedTime = estimatedDeliveryTime;
    if (!estimatedTime) {
      const now = new Date();
      const deliveryMinutes = orderType === 'delivery' ? 45 : 30;
      estimatedTime = new Date(now.getTime() + deliveryMinutes * 60000);
    }

    // Create order
    const order = await Order.create({
      orderNumber,
      customerId: req.user.id,
      status: 'pending',
      orderType,
      subtotal: totals.subtotal,
      tax: totals.tax,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      deliveryAddressId: orderType === 'delivery' ? deliveryAddressId : null,
      specialInstructions,
      estimatedDeliveryTime: estimatedTime
    }, { transaction });

    // Create order items
    const orderItemsWithOrderId = validatedOrderItems.map(item => ({
      ...item,
      orderId: order.id
    }));

    await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });

    // Reduce stock for each item
    for (const item of validatedOrderItems) {
      const stockRecord = await Stock.findOne({
        where: { menuItemId: item.menuItemId },
        transaction
      });

      if (stockRecord) {
        const newStock = stockRecord.currentStock - item.quantity;
        await stockRecord.update({
          currentStock: newStock,
          lastUpdated: new Date()
        }, { transaction });

        // Auto-disable menu item if stock reaches zero
        if (newStock === 0) {
          await MenuItem.update(
            { isAvailable: false },
            { 
              where: { id: item.menuItemId },
              transaction 
            }
          );
        }
      }
    }

    await transaction.commit();

    // Fetch complete order with associations
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: UserAddress,
          as: 'deliveryAddress',
          attributes: ['id', 'street', 'city', 'state', 'zipCode']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'price', 'image']
            }
          ]
        }
      ]
    });

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(createdOrder, req.user);
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
    }

    // Send notifications
    try {
      await NotificationService.notifyNewOrder(createdOrder.id, req.user.id);
    } catch (error) {
      console.error('Error sending order notifications:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder
    });
  } catch (error) {
    // Only rollback if transaction is still active
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
  }
};

// Update order status (Staff/Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actualDeliveryTime } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const previousStatus = order.status;
    const updateData = { status };

    // Set actual delivery time if status is delivered
    if (status === 'delivered' && !order.actualDeliveryTime) {
      updateData.actualDeliveryTime = actualDeliveryTime || new Date();
    }

    await order.update(updateData);

    // Send status update email
    try {
      await sendOrderStatusUpdateEmail(order, order.customer, previousStatus);
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the operation if email fails
    }

    // Send status update notification
    try {
      await NotificationService.notifyOrderStatusChange(id, status, order.customerId);
    } catch (notificationError) {
      console.error('Failed to send status update notification:', notificationError);
      // Don't fail the operation if notification fails
    }

    // Fetch updated order
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        ...updatedOrder.toJSON(),
        previousStatus,
        statusChanged: previousStatus !== status
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

// Cancel order (Customer can cancel pending/confirmed orders, Admin can cancel any)
const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: ['menuItemId', 'quantity']
        }
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own orders'
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed'];
    if (req.user.role === 'customer' && !cancellableStatuses.includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // If order is already cancelled
    if (order.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Restore stock for each order item
    for (const orderItem of order.orderItems) {
      const stockRecord = await Stock.findOne({
        where: { menuItemId: orderItem.menuItemId },
        transaction
      });

      if (stockRecord) {
        const restoredStock = stockRecord.currentStock + orderItem.quantity;
        await stockRecord.update({
          currentStock: restoredStock,
          lastUpdated: new Date()
        }, { transaction });

        // Re-enable menu item if it was disabled due to zero stock
        await MenuItem.update(
          { isAvailable: true },
          { 
            where: { id: orderItem.menuItemId },
            transaction 
          }
        );
      }
    }

    // Update order status
    await order.update({
      status: 'cancelled',
      specialInstructions: reason ? `${order.specialInstructions || ''}\nCancellation reason: ${reason}`.trim() : order.specialInstructions
    }, { transaction });

    await transaction.commit();

    // Send cancellation email
    try {
      await sendOrderStatusUpdateEmail(order, order.customer, order.status);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'cancelled',
        stockRestored: true
      }
    });
  } catch (error) {
    // Only rollback if transaction is still active
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order'
    });
  }
};

// Get order statistics (Admin/Staff only)
const getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const totalOrders = await Order.count({ where: dateFilter });
    
    const ordersByStatus = await Order.findAll({
      where: dateFilter,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const ordersByType = await Order.findAll({
      where: dateFilter,
      attributes: [
        'orderType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['orderType']
    });

    const revenueResult = await Order.findAll({
      where: {
        ...dateFilter,
        status: { [Op.in]: ['delivered', 'ready', 'out_for_delivery'] }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total')), 'averageOrderValue']
      ]
    });

    const revenue = revenueResult[0]?.dataValues || {};

    res.json({
      success: true,
      statistics: {
        totalOrders,
        ordersByStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        ordersByType: ordersByType.map(item => ({
          type: item.orderType,
          count: parseInt(item.dataValues.count)
        })),
        totalRevenue: parseFloat(revenue.totalRevenue || 0).toFixed(2),
        averageOrderValue: parseFloat(revenue.averageOrderValue || 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics'
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getMyOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStatistics
};
