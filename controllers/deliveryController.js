const { Delivery, Order, User, Staff, UserAddress, sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// Helper function to calculate distance (simplified - in production use Google Maps API)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Helper function to send delivery notification email
const sendDeliveryNotificationEmail = async (delivery, order, customer, type = 'status_update') => {
  try {
    let subject, html;
    
    switch (type) {
      case 'assigned':
        subject = `🚚 Delivery Assigned - Order #${order.orderNumber}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🚚 FUDO Delivery Update</h2>
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Delivery Assigned</h3>
              <p><strong>Order:</strong> #${order.orderNumber}</p>
              <p><strong>Status:</strong> ${delivery.status.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Estimated Delivery:</strong> ${new Date(delivery.estimatedDeliveryTime).toLocaleString()}</p>
              ${delivery.deliveryNotes ? `<p><strong>Notes:</strong> ${delivery.deliveryNotes}</p>` : ''}
            </div>
            <p>Your order has been assigned to a delivery person and will be with you soon!</p>
            <hr>
            <p style="color: #666; font-size: 12px;">FUDO Food Delivery Service</p>
          </div>
        `;
        break;
        
      case 'picked_up':
        subject = `📦 Order Picked Up - Order #${order.orderNumber}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">📦 FUDO Delivery Update</h2>
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Order Picked Up</h3>
              <p><strong>Order:</strong> #${order.orderNumber}</p>
              <p><strong>Status:</strong> ${delivery.status.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Estimated Delivery:</strong> ${new Date(delivery.estimatedDeliveryTime).toLocaleString()}</p>
            </div>
            <p>Your order has been picked up and is on its way to you!</p>
            <hr>
            <p style="color: #666; font-size: 12px;">FUDO Food Delivery Service</p>
          </div>
        `;
        break;
        
      case 'in_transit':
        subject = `🛵 Order In Transit - Order #${order.orderNumber}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🛵 FUDO Delivery Update</h2>
            <div style="background-color: #cce5ff; border: 1px solid #99ccff; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Order In Transit</h3>
              <p><strong>Order:</strong> #${order.orderNumber}</p>
              <p><strong>Status:</strong> ${delivery.status.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Estimated Delivery:</strong> ${new Date(delivery.estimatedDeliveryTime).toLocaleString()}</p>
            </div>
            <p>Your order is on its way! The delivery person will be with you shortly.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">FUDO Food Delivery Service</p>
          </div>
        `;
        break;
        
      case 'delivered':
        subject = `✅ Order Delivered - Order #${order.orderNumber}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">✅ FUDO Delivery Complete</h2>
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Order Delivered Successfully</h3>
              <p><strong>Order:</strong> #${order.orderNumber}</p>
              <p><strong>Delivered At:</strong> ${new Date(delivery.actualDeliveryTime).toLocaleString()}</p>
              <p><strong>Total Amount:</strong> $${order.total}</p>
            </div>
            <p>Your order has been delivered successfully! We hope you enjoy your meal.</p>
            <p>Please consider leaving us a review about your experience.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">FUDO Food Delivery Service</p>
          </div>
        `;
        break;
    }
    
    await emailService.sendEmail(customer.email, subject, html);
  } catch (error) {
    console.error('Failed to send delivery notification email:', error);
    throw error;
  }
};

// Create delivery record
const createDelivery = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      orderId,
      deliveryPersonId,
      estimatedDeliveryTime,
      deliveryFee,
      deliveryNotes
    } = req.body;

    // Validate required fields
    if (!orderId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Verify order exists and is in correct status
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: UserAddress,
          as: 'deliveryAddress',
          attributes: ['id', 'street', 'city', 'state', 'zipCode', 'latitude', 'longitude']
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

    if (!['confirmed', 'preparing', 'ready'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order must be confirmed, preparing, or ready for delivery assignment'
      });
    }

    // Check if delivery already exists for this order
    const existingDelivery = await Delivery.findOne({
      where: { orderId },
      transaction
    });

    if (existingDelivery) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Delivery already assigned for this order'
      });
    }

    // Verify delivery person exists and is active (if provided)
    if (deliveryPersonId) {
      const deliveryPerson = await Staff.findOne({
        where: { 
          id: deliveryPersonId,
          position: 'delivery',
          isActive: true
        },
        transaction
      });

      if (!deliveryPerson) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Delivery person not found or inactive'
        });
      }
    }

    // Calculate distance if address has coordinates
    let distance = null;
    if (order.deliveryAddress && order.deliveryAddress.latitude && order.deliveryAddress.longitude) {
      // Restaurant coordinates (you should store this in settings)
      const restaurantLat = 40.7128; // Example: NYC coordinates
      const restaurantLon = -74.0060;
      distance = calculateDistance(
        restaurantLat,
        restaurantLon,
        parseFloat(order.deliveryAddress.latitude),
        parseFloat(order.deliveryAddress.longitude)
      );
    }

    // Calculate estimated delivery time if not provided
    let finalEstimatedTime = estimatedDeliveryTime;
    if (!finalEstimatedTime) {
      const now = new Date();
      const additionalMinutes = distance ? Math.ceil(distance * 3) : 30; // 3 minutes per km + base time
      finalEstimatedTime = new Date(now.getTime() + additionalMinutes * 60000);
    }

    // Calculate delivery fee based on distance if not provided
    let finalDeliveryFee = deliveryFee || order.deliveryFee;
    if (!finalDeliveryFee && distance) {
      finalDeliveryFee = Math.max(5.00, distance * 1.5); // Minimum $5, $1.5 per km
    }

    // Create delivery record
    const delivery = await Delivery.create({
      orderId,
      deliveryPersonId,
      status: 'assigned',
      estimatedDeliveryTime: finalEstimatedTime,
      deliveryFee: finalDeliveryFee || 5.00,
      distance: distance ? parseFloat(distance.toFixed(2)) : null,
      deliveryNotes
    }, { transaction });

    // Update order status
    await Order.update(
      { status: 'out_for_delivery' },
      { 
        where: { id: orderId },
        transaction 
      }
    );

    await transaction.commit();

    // Send delivery assignment notification
    try {
      await sendDeliveryNotificationEmail(delivery, order, order.customer, 'assigned');
    } catch (emailError) {
      console.error('Failed to send delivery notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Delivery created and assigned successfully',
      data: {
        id: delivery.id,
        orderId: delivery.orderId,
        deliveryPersonId: delivery.deliveryPersonId,
        status: delivery.status,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
        deliveryFee: delivery.deliveryFee,
        distance: delivery.distance,
        deliveryNotes: delivery.deliveryNotes,
        createdAt: delivery.createdAt
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating delivery'
    });
  }
};

// Get all deliveries
const getAllDeliveries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      deliveryPersonId,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Filter by status
    if (status) {
      whereConditions.status = status;
    }

    // Filter by delivery person
    if (deliveryPersonId) {
      whereConditions.deliveryPersonId = deliveryPersonId;
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

    const deliveries = await Delivery.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'customerId'],
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
            }
          ]
        },
        {
          model: Staff,
          as: 'deliveryPerson',
          attributes: ['id', 'employeeId', 'position'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email', 'phone']
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
      count: deliveries.count,
      totalPages: Math.ceil(deliveries.count / limit),
      currentPage: parseInt(page),
      data: deliveries.rows
    });

  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deliveries'
    });
  }
};

// Get deliveries assigned to current delivery person
const getMyDeliveries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    // Find staff record for current user
    const staff = await Staff.findOne({
      where: { 
        userId: req.user.id,
        position: 'delivery'
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Delivery staff profile not found'
      });
    }

    const whereConditions = { deliveryPersonId: staff.id };

    // Filter by status
    if (status) {
      whereConditions.status = status;
    }

    const deliveries = await Delivery.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'customerId'],
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'firstName', 'lastName', 'phone']
            },
            {
              model: UserAddress,
              as: 'deliveryAddress',
              attributes: ['id', 'street', 'city', 'state', 'zipCode']
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
      count: deliveries.count,
      totalPages: Math.ceil(deliveries.count / limit),
      currentPage: parseInt(page),
      data: deliveries.rows
    });

  } catch (error) {
    console.error('Error fetching my deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deliveries'
    });
  }
};

// Get delivery by ID
const getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'customerId'],
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
            },
            {
              model: UserAddress,
              as: 'deliveryAddress',
              attributes: ['id', 'street', 'city', 'state', 'zipCode', 'latitude', 'longitude']
            }
          ]
        },
        {
          model: Staff,
          as: 'deliveryPerson',
          attributes: ['id', 'employeeId', 'position'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check access permissions for delivery staff
    if (req.user.role === 'staff') {
      const staff = await Staff.findOne({
        where: { 
          userId: req.user.id,
          position: 'delivery'
        }
      });

      if (staff && delivery.deliveryPersonId !== staff.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: delivery
    });

  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery'
    });
  }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, deliveryNotes, actualDeliveryTime } = req.body;

    if (!status) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const delivery = await Delivery.findByPk(id, {
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

    if (!delivery) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check if user is the assigned delivery person (for staff)
    if (req.user.role === 'staff') {
      const staff = await Staff.findOne({
        where: { 
          userId: req.user.id,
          position: 'delivery'
        },
        transaction
      });

      if (!staff || delivery.deliveryPersonId !== staff.id) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'You can only update your own deliveries'
        });
      }
    }

    // Prepare update data
    const updateData = { status };
    
    if (deliveryNotes) {
      updateData.deliveryNotes = deliveryNotes;
    }
    
    if (status === 'delivered') {
      updateData.actualDeliveryTime = actualDeliveryTime || new Date();
    }

    // Update delivery
    await Delivery.update(updateData, {
      where: { id },
      transaction
    });

    // Update related order status
    let orderStatus;
    switch (status) {
      case 'picked_up':
        orderStatus = 'out_for_delivery';
        break;
      case 'in_transit':
        orderStatus = 'out_for_delivery';
        break;
      case 'delivered':
        orderStatus = 'delivered';
        break;
      case 'failed':
        orderStatus = 'ready'; // Return to kitchen
        break;
      default:
        orderStatus = null;
    }

    if (orderStatus) {
      await Order.update(
        { status: orderStatus },
        { 
          where: { id: delivery.orderId },
          transaction 
        }
      );
    }

    await transaction.commit();

    // Send status update notification
    try {
      await sendDeliveryNotificationEmail(delivery, delivery.order, delivery.order.customer, status);
    } catch (emailError) {
      console.error('Failed to send delivery notification email:', emailError);
    }

    // Fetch updated delivery
    const updatedDelivery = await Delivery.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: updatedDelivery
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery status'
    });
  }
};

// Assign delivery to delivery person
const assignDelivery = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { deliveryPersonId } = req.body;

    if (!deliveryPersonId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Delivery person ID is required'
      });
    }

    // Verify delivery person exists and is active
    const deliveryPerson = await Staff.findOne({
      where: { 
        id: deliveryPersonId,
        position: 'delivery',
        isActive: true
      },
      transaction
    });

    if (!deliveryPerson) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found or inactive'
      });
    }

    const delivery = await Delivery.findByPk(id, {
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

    if (!delivery) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Update delivery assignment
    await Delivery.update(
      { deliveryPersonId, status: 'assigned' },
      { 
        where: { id },
        transaction 
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Delivery assigned successfully',
      data: {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        deliveryPersonId,
        status: 'assigned'
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error assigning delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning delivery'
    });
  }
};

// Get delivery tracking information
const getDeliveryTracking = async (req, res) => {
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

    const delivery = await Delivery.findOne({
      where: { orderId },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status']
        },
        {
          model: Staff,
          as: 'deliveryPerson',
          attributes: ['id', 'employeeId', 'position'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery information not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: delivery.orderId,
        orderNumber: delivery.order.orderNumber,
        deliveryStatus: delivery.status,
        orderStatus: delivery.order.status,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
        actualDeliveryTime: delivery.actualDeliveryTime,
        distance: delivery.distance,
        deliveryFee: delivery.deliveryFee,
        deliveryNotes: delivery.deliveryNotes,
        deliveryPerson: delivery.deliveryPerson && delivery.deliveryPerson.user ? {
          name: `${delivery.deliveryPerson.user.firstName} ${delivery.deliveryPerson.user.lastName}`,
          phone: delivery.deliveryPerson.user.phone
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching delivery tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery tracking'
    });
  }
};

// Get delivery statistics
const getDeliveryStatistics = async (req, res) => {
  try {
    const { startDate, endDate, deliveryPersonId } = req.query;
    
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

    if (deliveryPersonId) {
      whereConditions.deliveryPersonId = deliveryPersonId;
    }

    // Overall statistics
    const totalDeliveries = await Delivery.count({ where: whereConditions });
    const deliveredCount = await Delivery.count({ 
      where: { ...whereConditions, status: 'delivered' } 
    });
    const inTransitCount = await Delivery.count({ 
      where: { ...whereConditions, status: 'in_transit' } 
    });
    const failedCount = await Delivery.count({ 
      where: { ...whereConditions, status: 'failed' } 
    });

    // Average delivery time for completed deliveries
    const completedDeliveries = await Delivery.findAll({
      where: { ...whereConditions, status: 'delivered' },
      attributes: ['estimatedDeliveryTime', 'actualDeliveryTime']
    });

    let avgDeliveryTime = 0;
    if (completedDeliveries.length > 0) {
      const totalTime = completedDeliveries.reduce((sum, delivery) => {
        const estimated = new Date(delivery.estimatedDeliveryTime);
        const actual = new Date(delivery.actualDeliveryTime);
        return sum + (actual - estimated);
      }, 0);
      avgDeliveryTime = totalTime / completedDeliveries.length / (1000 * 60); // Convert to minutes
    }

    // Distance and fee statistics
    const distanceStats = await Delivery.findAll({
      where: { ...whereConditions, distance: { [Op.not]: null } },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('distance')), 'avgDistance'],
        [sequelize.fn('MAX', sequelize.col('distance')), 'maxDistance'],
        [sequelize.fn('SUM', sequelize.col('deliveryFee')), 'totalFees']
      ]
    });

    // Top delivery persons
    const topDeliveryPersons = await Delivery.findAll({
      where: { ...whereConditions, status: 'delivered' },
      include: [
        {
          model: Staff,
          as: 'deliveryPerson',
          attributes: ['id', 'employeeId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }
          ]
        }
      ],
      attributes: [
        'deliveryPersonId',
        [sequelize.fn('COUNT', sequelize.col('Delivery.id')), 'deliveryCount']
      ],
      group: ['deliveryPersonId', 'deliveryPerson.id', 'deliveryPerson.user.id', 'deliveryPerson.user.firstName', 'deliveryPerson.user.lastName'],
      order: [[sequelize.fn('COUNT', sequelize.col('Delivery.id')), 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalDeliveries,
          deliveredCount,
          inTransitCount,
          failedCount,
          successRate: totalDeliveries > 0 ? ((deliveredCount / totalDeliveries) * 100).toFixed(2) + '%' : '0%'
        },
        performance: {
          avgDeliveryTime: Math.round(avgDeliveryTime) + ' minutes',
          avgDistance: distanceStats[0]?.dataValues.avgDistance ? parseFloat(distanceStats[0].dataValues.avgDistance).toFixed(2) + ' km' : 'N/A',
          maxDistance: distanceStats[0]?.dataValues.maxDistance ? parseFloat(distanceStats[0].dataValues.maxDistance).toFixed(2) + ' km' : 'N/A',
          totalDeliveryFees: distanceStats[0]?.dataValues.totalFees ? '$' + parseFloat(distanceStats[0].dataValues.totalFees).toFixed(2) : '$0.00'
        },
        topDeliveryPersons: topDeliveryPersons.map(dp => ({
          id: dp.deliveryPersonId,
          name: dp.deliveryPerson && dp.deliveryPerson.user ? `${dp.deliveryPerson.user.firstName} ${dp.deliveryPerson.user.lastName}` : 'Unknown',
          deliveryCount: parseInt(dp.dataValues.deliveryCount)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching delivery statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery statistics'
    });
  }
};

module.exports = {
  createDelivery,
  getAllDeliveries,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  assignDelivery,
  getDeliveryTracking,
  getDeliveryStatistics
};
