const { Stock, MenuItem, Category } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// Email notification functions
const sendLowStockAlert = async (stockRecord, menuItem) => {
  try {
    const subject = `🚨 Low Stock Alert: ${menuItem.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">⚠️ Low Stock Alert</h2>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>${menuItem.name}</h3>
          <p><strong>Current Stock:</strong> ${stockRecord.currentStock} ${stockRecord.unit}</p>
          <p><strong>Minimum Stock:</strong> ${stockRecord.minimumStock} ${stockRecord.unit}</p>
          <p><strong>Status:</strong> <span style="color: #e17055;">Below Minimum Threshold</span></p>
          ${stockRecord.supplier ? `<p><strong>Supplier:</strong> ${stockRecord.supplier}</p>` : ''}
        </div>
        <p>Please restock this item as soon as possible to avoid running out of inventory.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">FUDO Stock Management System</p>
      </div>
    `;
    
    // Send to staff/admin emails (you can configure these in environment variables)
    const alertEmails = process.env.STOCK_ALERT_EMAILS ? 
      process.env.STOCK_ALERT_EMAILS.split(',') : 
      ['admin@fudo.com']; // fallback
    
    for (const email of alertEmails) {
      await emailService.sendEmail(email.trim(), subject, html);
    }
  } catch (error) {
    console.error('Error sending low stock alert:', error);
  }
};

const sendOutOfStockAlert = async (stockRecord, menuItem) => {
  try {
    const subject = `🔴 OUT OF STOCK: ${menuItem.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">🔴 OUT OF STOCK ALERT</h2>
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>${menuItem.name}</h3>
          <p><strong>Current Stock:</strong> <span style="color: #e74c3c;">0 ${stockRecord.unit}</span></p>
          <p><strong>Status:</strong> <span style="color: #e74c3c;">OUT OF STOCK</span></p>
          <p><strong>Item Availability:</strong> Automatically disabled</p>
          ${stockRecord.supplier ? `<p><strong>Supplier:</strong> ${stockRecord.supplier}</p>` : ''}
        </div>
        <p><strong>⚠️ URGENT ACTION REQUIRED:</strong> This item is now out of stock and has been automatically removed from the menu. Please restock immediately.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">FUDO Stock Management System</p>
      </div>
    `;
    
    const alertEmails = process.env.STOCK_ALERT_EMAILS ? 
      process.env.STOCK_ALERT_EMAILS.split(',') : 
      ['admin@fudo.com'];
    
    for (const email of alertEmails) {
      await emailService.sendEmail(email.trim(), subject, html);
    }
  } catch (error) {
    console.error('Error sending out of stock alert:', error);
  }
};

const sendStockMovementNotification = async (stockRecord, menuItem, movement) => {
  try {
    const isAddition = movement.type === 'addition';
    const subject = `📦 Stock ${isAddition ? 'Added' : 'Reduced'}: ${menuItem.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isAddition ? '#27ae60' : '#f39c12'};">${isAddition ? '📦' : '📤'} Stock ${isAddition ? 'Addition' : 'Reduction'}</h2>
        <div style="background-color: ${isAddition ? '#d4edda' : '#fff3cd'}; border: 1px solid ${isAddition ? '#c3e6cb' : '#ffeaa7'}; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>${menuItem.name}</h3>
          <p><strong>Quantity ${isAddition ? 'Added' : 'Reduced'}:</strong> ${movement.quantity} ${stockRecord.unit}</p>
          <p><strong>Previous Stock:</strong> ${movement.previousStock} ${stockRecord.unit}</p>
          <p><strong>New Stock:</strong> ${movement.newStock} ${stockRecord.unit}</p>
          <p><strong>Reason:</strong> ${movement.reason}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
        ${movement.newStock <= stockRecord.minimumStock ? 
          `<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <p style="color: #856404;"><strong>⚠️ Warning:</strong> Stock is now at or below minimum threshold (${stockRecord.minimumStock} ${stockRecord.unit})</p>
          </div>` : ''
        }
        <hr>
        <p style="color: #666; font-size: 12px;">FUDO Stock Management System</p>
      </div>
    `;
    
    const alertEmails = process.env.STOCK_ALERT_EMAILS ? 
      process.env.STOCK_ALERT_EMAILS.split(',') : 
      ['admin@fudo.com'];
    
    // Only send notifications for significant movements or when stock gets low
    if (movement.quantity >= 10 || movement.newStock <= stockRecord.minimumStock) {
      for (const email of alertEmails) {
        await emailService.sendEmail(email.trim(), subject, html);
      }
    }
  } catch (error) {
    console.error('Error sending stock movement notification:', error);
  }
};

// Get all stock records with filtering and pagination
const getAllStock = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      menuItemId,
      lowStock = false,
      unit,
      supplier 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Filter by menu item
    if (menuItemId) {
      whereConditions.menuItemId = menuItemId;
    }

    // Filter by unit
    if (unit) {
      whereConditions.unit = unit;
    }

    // Filter by supplier
    if (supplier) {
      whereConditions.supplier = { [Op.iLike]: `%${supplier}%` };
    }

    // Filter for low stock items
    if (lowStock === 'true') {
      whereConditions.currentStock = {
        [Op.lte]: Stock.sequelize.col('minimumStock')
      };
    }

    const stockRecords = await Stock.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'price', 'isAvailable'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['lastUpdated', 'DESC']]
    });

    res.json({
      success: true,
      count: stockRecords.count,
      totalPages: Math.ceil(stockRecords.count / limit),
      currentPage: parseInt(page),
      data: stockRecords.rows
    });
  } catch (error) {
    console.error('Error fetching stock records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock records'
    });
  }
};

// Get stock record by ID
const getStockById = async (req, res) => {
  try {
    const { id } = req.params;

    const stockRecord = await Stock.findByPk(id, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'price', 'isAvailable'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!stockRecord) {
      return res.status(404).json({
        success: false,
        message: 'Stock record not found'
      });
    }

    res.json({
      success: true,
      data: stockRecord
    });
  } catch (error) {
    console.error('Error fetching stock record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock record'
    });
  }
};

// Get stock by menu item ID
const getStockByMenuItemId = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const stockRecord = await Stock.findOne({
      where: { menuItemId },
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'price', 'isAvailable']
        }
      ]
    });

    if (!stockRecord) {
      return res.status(404).json({
        success: false,
        message: 'Stock record not found for this menu item'
      });
    }

    res.json({
      success: true,
      data: stockRecord
    });
  } catch (error) {
    console.error('Error fetching stock by menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock by menu item'
    });
  }
};

// Update stock record (Staff/Admin only)
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      currentStock,
      minimumStock,
      maximumStock,
      unit,
      supplier,
      cost
    } = req.body;

    const stockRecord = await Stock.findByPk(id);
    if (!stockRecord) {
      return res.status(404).json({
        success: false,
        message: 'Stock record not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (currentStock !== undefined) updateData.currentStock = currentStock;
    if (minimumStock !== undefined) updateData.minimumStock = minimumStock;
    if (maximumStock !== undefined) updateData.maximumStock = maximumStock;
    if (unit !== undefined) updateData.unit = unit;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (cost !== undefined) updateData.cost = cost;
    
    // Always update the lastUpdated timestamp
    updateData.lastUpdated = new Date();

    await stockRecord.update(updateData);

    // Fetch updated record with associations
    const updatedStock = await Stock.findByPk(id, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'price']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Stock record updated successfully',
      data: updatedStock
    });
  } catch (error) {
    console.error('Error updating stock record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock record'
    });
  }
};

// Add stock (inventory received) - Staff/Admin only
const addStock = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { quantity, reason = 'Inventory received', cost } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    const stockRecord = await Stock.findOne({ where: { menuItemId } });
    if (!stockRecord) {
      return res.status(404).json({
        success: false,
        message: 'Stock record not found for this menu item'
      });
    }

    const previousStock = stockRecord.currentStock;
    const newStock = previousStock + parseInt(quantity);

    // Update stock
    const updateData = {
      currentStock: newStock,
      lastUpdated: new Date()
    };

    // Update cost if provided
    if (cost !== undefined) {
      updateData.cost = cost;
    }

    await stockRecord.update(updateData);

    // Fetch updated record with associations
    const updatedStock = await Stock.findByPk(stockRecord.id, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'price']
        }
      ]
    });

    // Create movement object for notification
    const stockMovement = {
      type: 'addition',
      quantity: parseInt(quantity),
      previousStock,
      newStock,
      reason
    };

    // Send email notification for stock addition
    try {
      await sendStockMovementNotification(updatedStock, updatedStock.menuItem, stockMovement);
    } catch (emailError) {
      console.error('Failed to send stock addition notification:', emailError);
      // Don't fail the operation if email fails
    }

    res.json({
      success: true,
      message: 'Stock added successfully',
      data: {
        ...updatedStock.toJSON(),
        stockMovement
      }
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding stock'
    });
  }
};

// Reduce stock (for orders/consumption) - Staff/Admin only
const reduceStock = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { quantity, reason = 'Order fulfillment' } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    const stockRecord = await Stock.findOne({ 
      where: { menuItemId },
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!stockRecord) {
      return res.status(404).json({
        success: false,
        message: 'Stock record not found for this menu item'
      });
    }

    const previousStock = stockRecord.currentStock;
    const requestedQuantity = parseInt(quantity);

    // Check if sufficient stock available
    if (previousStock < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${previousStock}, Requested: ${requestedQuantity}`
      });
    }

    const newStock = previousStock - requestedQuantity;

    // Update stock
    await stockRecord.update({
      currentStock: newStock,
      lastUpdated: new Date()
    });

    // Check if item should be marked as unavailable
    let menuItemUpdate = {};
    if (newStock === 0) {
      await stockRecord.menuItem.update({ isAvailable: false });
      menuItemUpdate.availabilityChanged = true;
      menuItemUpdate.newAvailability = false;
    }

    // Fetch updated record
    const updatedStock = await Stock.findByPk(stockRecord.id, {
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'price', 'isAvailable']
        }
      ]
    });

    // Create movement object for response and notification
    const stockMovement = {
      type: 'reduction',
      quantity: requestedQuantity,
      previousStock,
      newStock,
      reason
    };

    // Send email notifications
    try {
      // Send stock movement notification
      await sendStockMovementNotification(updatedStock, updatedStock.menuItem, stockMovement);
      
      // Send out of stock alert if stock reached zero
      if (newStock === 0) {
        await sendOutOfStockAlert(updatedStock, updatedStock.menuItem);
      }
      // Send low stock alert if stock is below minimum but not zero
      else if (newStock <= updatedStock.minimumStock) {
        await sendLowStockAlert(updatedStock, updatedStock.menuItem);
      }
    } catch (emailError) {
      console.error('Failed to send stock reduction notifications:', emailError);
      // Don't fail the operation if email fails
    }

    res.json({
      success: true,
      message: 'Stock reduced successfully',
      data: {
        ...updatedStock.toJSON(),
        stockMovement,
        ...menuItemUpdate
      }
    });
  } catch (error) {
    console.error('Error reducing stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error reducing stock'
    });
  }
};

// Check stock availability for multiple items
const checkStockAvailability = async (req, res) => {
  try {
    const { items } = req.body; // Array of { menuItemId, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    const stockChecks = [];
    const unavailableItems = [];

    for (const item of items) {
      const { menuItemId, quantity } = item;

      if (!menuItemId || !quantity || quantity <= 0) {
        unavailableItems.push({
          menuItemId,
          reason: 'Invalid quantity',
          available: false
        });
        continue;
      }

      const stockRecord = await Stock.findOne({
        where: { menuItemId },
        include: [
          {
            model: MenuItem,
            as: 'menuItem',
            attributes: ['id', 'name', 'isAvailable']
          }
        ]
      });

      if (!stockRecord) {
        unavailableItems.push({
          menuItemId,
          reason: 'Stock record not found',
          available: false
        });
        continue;
      }

      if (!stockRecord.menuItem.isAvailable) {
        unavailableItems.push({
          menuItemId,
          reason: 'Menu item not available',
          available: false,
          currentStock: stockRecord.currentStock
        });
        continue;
      }

      const available = stockRecord.currentStock >= quantity;
      stockChecks.push({
        menuItemId,
        menuItemName: stockRecord.menuItem.name,
        requestedQuantity: quantity,
        currentStock: stockRecord.currentStock,
        available,
        reason: available ? 'Available' : 'Insufficient stock'
      });

      if (!available) {
        unavailableItems.push({
          menuItemId,
          reason: 'Insufficient stock',
          available: false,
          currentStock: stockRecord.currentStock,
          requestedQuantity: quantity
        });
      }
    }

    const allAvailable = unavailableItems.length === 0;

    res.json({
      success: true,
      allAvailable,
      stockChecks,
      unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined
    });
  } catch (error) {
    console.error('Error checking stock availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking stock availability'
    });
  }
};

// Get low stock alerts
const getLowStockAlerts = async (req, res) => {
  try {
    const { includeZeroStock = true } = req.query;

    let whereCondition = {
      currentStock: {
        [Op.lte]: Stock.sequelize.col('minimumStock')
      }
    };

    // Optionally exclude zero stock items
    if (includeZeroStock === 'false') {
      whereCondition.currentStock = {
        [Op.and]: [
          { [Op.lte]: Stock.sequelize.col('minimumStock') },
          { [Op.gt]: 0 }
        ]
      };
    }

    const lowStockItems = await Stock.findAll({
      where: whereCondition,
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'price', 'isAvailable'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['currentStock', 'ASC']]
    });

    // Categorize alerts
    const zeroStock = lowStockItems.filter(item => item.currentStock === 0);
    const lowStock = lowStockItems.filter(item => 
      item.currentStock > 0 && item.currentStock <= item.minimumStock
    );

    res.json({
      success: true,
      summary: {
        totalAlerts: lowStockItems.length,
        zeroStockCount: zeroStock.length,
        lowStockCount: lowStock.length
      },
      alerts: {
        zeroStock,
        lowStock
      },
      allAlerts: lowStockItems
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock alerts'
    });
  }
};

// Send bulk low stock alert email (Staff/Admin only)
const sendBulkLowStockAlert = async (req, res) => {
  try {
    // Get all low stock items
    const lowStockItems = await Stock.findAll({
      where: {
        currentStock: {
          [Op.lte]: Stock.sequelize.col('minimumStock')
        }
      },
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name', 'price', 'isAvailable'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['currentStock', 'ASC']]
    });

    if (lowStockItems.length === 0) {
      return res.json({
        success: true,
        message: 'No low stock items found',
        alertsSent: 0
      });
    }

    // Categorize items
    const zeroStock = lowStockItems.filter(item => item.currentStock === 0);
    const lowStock = lowStockItems.filter(item => 
      item.currentStock > 0 && item.currentStock <= item.minimumStock
    );

    // Create bulk alert email
    const subject = `📊 Daily Stock Report - ${lowStockItems.length} Items Need Attention`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">📊 Daily Stock Report</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Summary</h3>
          <p>📦 Total Items Needing Attention: <strong>${lowStockItems.length}</strong></p>
          <p>🔴 Out of Stock: <strong>${zeroStock.length}</strong></p>
          <p>⚠️ Low Stock: <strong>${lowStock.length}</strong></p>
        </div>

        ${zeroStock.length > 0 ? `
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #721c24;">🔴 OUT OF STOCK ITEMS (${zeroStock.length})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f1f1f1;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Item</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Category</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Unit</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Supplier</th>
                </tr>
              </thead>
              <tbody>
                ${zeroStock.map(item => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.menuItem.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.menuItem.category.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.unit}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.supplier || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${lowStock.length > 0 ? `
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #856404;">⚠️ LOW STOCK ITEMS (${lowStock.length})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f1f1f1;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Item</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Current</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Minimum</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Unit</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Supplier</th>
                </tr>
              </thead>
              <tbody>
                ${lowStock.map(item => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.menuItem.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.currentStock}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.minimumStock}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.unit}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.supplier || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div style="margin-top: 20px; padding: 15px; background-color: #e8f4f8; border-radius: 5px;">
          <h4>📝 Action Required:</h4>
          <ul>
            ${zeroStock.length > 0 ? '<li>🔴 <strong>URGENT:</strong> Restock out-of-stock items immediately</li>' : ''}
            ${lowStock.length > 0 ? '<li>⚠️ Schedule restocking for low stock items</li>' : ''}
            <li>📞 Contact suppliers for delivery scheduling</li>
            <li>📊 Review minimum stock thresholds if necessary</li>
          </ul>
        </div>

        <hr>
        <p style="color: #666; font-size: 12px;">FUDO Stock Management System - Generated automatically</p>
      </div>
    `;

    // Send bulk alert email
    const alertEmails = process.env.STOCK_ALERT_EMAILS ? 
      process.env.STOCK_ALERT_EMAILS.split(',') : 
      ['admin@fudo.com'];
    
    let emailsSent = 0;
    for (const email of alertEmails) {
      try {
        await emailService.sendEmail(email.trim(), subject, html);
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send bulk alert to ${email}:`, emailError);
      }
    }

    res.json({
      success: true,
      message: 'Bulk low stock alert sent successfully',
      data: {
        totalLowStockItems: lowStockItems.length,
        zeroStockCount: zeroStock.length,
        lowStockCount: lowStock.length,
        emailsSent,
        recipientCount: alertEmails.length
      }
    });
  } catch (error) {
    console.error('Error sending bulk low stock alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk low stock alert'
    });
  }
};

// Get stock statistics
const getStockStatistics = async (req, res) => {
  try {
    const totalItems = await Stock.count();
    
    const lowStockCount = await Stock.count({
      where: {
        currentStock: {
          [Op.lte]: Stock.sequelize.col('minimumStock')
        }
      }
    });

    const zeroStockCount = await Stock.count({
      where: { currentStock: 0 }
    });

    const overStockCount = await Stock.count({
      where: {
        [Op.and]: [
          { maximumStock: { [Op.ne]: null } },
          { currentStock: { [Op.gt]: Stock.sequelize.col('maximumStock') } }
        ]
      }
    });

    // Get total stock value (if cost is available)
    const stockValueResult = await Stock.findAll({
      attributes: [
        [Stock.sequelize.fn('SUM', 
          Stock.sequelize.literal('"currentStock" * COALESCE(cost, 0)')
        ), 'totalValue']
      ],
      where: {
        cost: { [Op.ne]: null }
      }
    });

    const totalStockValue = stockValueResult[0]?.dataValues?.totalValue || 0;

    // Get units distribution
    const unitsDistribution = await Stock.findAll({
      attributes: [
        'unit',
        [Stock.sequelize.fn('COUNT', Stock.sequelize.col('id')), 'count']
      ],
      group: ['unit'],
      order: [[Stock.sequelize.fn('COUNT', Stock.sequelize.col('id')), 'DESC']]
    });

    res.json({
      success: true,
      statistics: {
        totalItems,
        lowStockCount,
        zeroStockCount,
        overStockCount,
        healthyStockCount: totalItems - lowStockCount - zeroStockCount,
        totalStockValue: parseFloat(totalStockValue).toFixed(2),
        unitsDistribution: unitsDistribution.map(unit => ({
          unit: unit.unit,
          count: parseInt(unit.dataValues.count)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching stock statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock statistics'
    });
  }
};

module.exports = {
  getAllStock,
  getStockById,
  getStockByMenuItemId,
  updateStock,
  addStock,
  reduceStock,
  checkStockAvailability,
  getLowStockAlerts,
  sendBulkLowStockAlert,
  getStockStatistics
};
