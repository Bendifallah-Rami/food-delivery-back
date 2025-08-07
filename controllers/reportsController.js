const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Import models
const db = require('../models');
const { 
  Order, 
  OrderItem, 
  MenuItem, 
  User, 
  Staff, 
  Payment,
  Reports,
  Delivery 
} = db;

// Map correct model names
const Category = db.Category; // This will be mapped from categorie.js

// Helper function to get date range based on period
const getDateRange = (period, customStart = null, customEnd = null) => {
  const now = moment();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = now.clone().startOf('day');
      endDate = now.clone().endOf('day');
      break;
    case 'yesterday':
      startDate = now.clone().subtract(1, 'day').startOf('day');
      endDate = now.clone().subtract(1, 'day').endOf('day');
      break;
    case 'this_week':
      startDate = now.clone().startOf('week');
      endDate = now.clone().endOf('week');
      break;
    case 'last_week':
      startDate = now.clone().subtract(1, 'week').startOf('week');
      endDate = now.clone().subtract(1, 'week').endOf('week');
      break;
    case 'this_month':
      startDate = now.clone().startOf('month');
      endDate = now.clone().endOf('month');
      break;
    case 'last_month':
      startDate = now.clone().subtract(1, 'month').startOf('month');
      endDate = now.clone().subtract(1, 'month').endOf('month');
      break;
    case 'this_year':
      startDate = now.clone().startOf('year');
      endDate = now.clone().endOf('year');
      break;
    case 'custom':
      startDate = moment(customStart);
      endDate = moment(customEnd);
      break;
    default:
      startDate = now.clone().startOf('day');
      endDate = now.clone().endOf('day');
  }

  return { startDate: startDate.toDate(), endDate: endDate.toDate() };
};

// Helper function to build where clause based on filters
const buildWhereClause = (period, category, status, customStart, customEnd) => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);
  const whereClause = {
    createdAt: {
      [Op.between]: [startDate, endDate]
    }
  };

  if (status && status !== 'all') {
    whereClause.status = status;
  }

  return whereClause;
};

// Helper function to build category where clause
const buildCategoryWhereClause = (category) => {
  if (!category || category === 'all') {
    return {};
  }
  return { name: category };
};

// Get KPI metrics
const getMetrics = async (req, res) => {
  try {
    const { period = 'today', category = 'all', status = 'all', customStart, customEnd } = req.query;
    
    const orderWhere = buildWhereClause(period, category, status, customStart, customEnd);
    const categoryWhere = buildCategoryWhereClause(category);

    // Include category filter through MenuItem if specified
    const includeOptions = [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [{
          model: MenuItem,
          as: 'menuItem',
          include: [{
            model: Category,
            as: 'category',
            where: categoryWhere,
            required: category !== 'all'
          }]
        }]
      }
    ];

    // Current period metrics
    const orders = await Order.findAll({
      where: orderWhere,
      include: includeOptions
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.customerId)).size;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Previous period for growth calculation
    const { startDate: prevStart, endDate: prevEnd } = getDateRange(
      period === 'custom' ? 'custom' : period,
      customStart ? moment(customStart).subtract(moment(customEnd).diff(moment(customStart))).format('YYYY-MM-DD') : null,
      customStart ? moment(customStart).subtract(1, 'day').format('YYYY-MM-DD') : null
    );

    const prevOrders = await Order.findAll({
      where: {
        ...orderWhere,
        createdAt: {
          [Op.between]: [prevStart, prevEnd]
        }
      },
      include: includeOptions
    });

    const prevRevenue = prevOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        revenue: totalRevenue,
        orders: totalOrders,
        customers: uniqueCustomers,
        avgOrderValue: avgOrderValue,
        growth: revenueGrowth
      }
    });

  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving metrics',
      error: error.message
    });
  }
};

// Get hourly sales breakdown for today
const getHourlySales = async (req, res) => {
  try {
    const { category = 'all', status = 'all' } = req.query;
    
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    
    const orderWhere = {
      createdAt: {
        [Op.between]: [today.toDate(), tomorrow.toDate()]
      }
    };

    if (status !== 'all') {
      orderWhere.status = status;
    }

    const categoryWhere = buildCategoryWhereClause(category);
    const includeOptions = [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [{
          model: MenuItem,
          as: 'menuItem',
          include: [{
            model: Category,
            as: 'category',
            where: categoryWhere,
            required: category !== 'all'
          }]
        }]
      }
    ];

    const orders = await Order.findAll({
      where: orderWhere,
      include: includeOptions,
      attributes: ['id', 'total', 'createdAt']
    });

    // Group by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: i, orders: 0, revenue: 0 };
    }

    orders.forEach(order => {
      const hour = moment(order.createdAt).hour();
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += parseFloat(order.total);
    });

    res.json({
      success: true,
      data: Object.values(hourlyData)
    });

  } catch (error) {
    console.error('Error getting hourly sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hourly sales',
      error: error.message
    });
  }
};

// Get monthly trend for the year
const getMonthlyTrend = async (req, res) => {
  try {
    const { category = 'all', status = 'all', year = moment().year() } = req.query;
    
    const startOfYear = moment().year(year).startOf('year');
    const endOfYear = moment().year(year).endOf('year');
    
    const orderWhere = {
      createdAt: {
        [Op.between]: [startOfYear.toDate(), endOfYear.toDate()]
      }
    };

    if (status !== 'all') {
      orderWhere.status = status;
    }

    const categoryWhere = buildCategoryWhereClause(category);
    const includeOptions = [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [{
          model: MenuItem,
          as: 'menuItem',
          include: [{
            model: Category,
            as: 'category',
            where: categoryWhere,
            required: category !== 'all'
          }]
        }]
      }
    ];

    const orders = await Order.findAll({
      where: orderWhere,
      include: includeOptions,
      attributes: ['id', 'total', 'createdAt']
    });

    // Group by month
    const monthlyData = {};
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = { 
        month: moment().month(i).format('MMM'),
        revenue: 0, 
        orders: 0 
      };
    }

    orders.forEach(order => {
      const month = moment(order.createdAt).month();
      monthlyData[month].orders += 1;
      monthlyData[month].revenue += parseFloat(order.total);
    });

    res.json({
      success: true,
      data: Object.values(monthlyData)
    });

  } catch (error) {
    console.error('Error getting monthly trend:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving monthly trend',
      error: error.message
    });
  }
};

// Get top selling items
const getTopSellingItems = async (req, res) => {
  try {
    const { period = 'today', category = 'all', status = 'all', customStart, customEnd, limit = 10 } = req.query;
    
    const orderWhere = buildWhereClause(period, category, status, customStart, customEnd);
    const categoryWhere = buildCategoryWhereClause(category);

    const topItems = await OrderItem.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhere,
          attributes: []
        },
        {
          model: MenuItem,
          as: 'menuItem',
          include: [{
            model: Category,
            as: 'category',
            where: categoryWhere,
            required: category !== 'all'
          }],
          attributes: ['name', 'price']
        }
      ],
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * "unitPrice"')), 'totalRevenue']
      ],
      group: ['menuItemId', 'menuItem.id', 'menuItem->category.id'],
      order: [[Sequelize.literal('SUM(quantity * "unitPrice")'), 'DESC']],
      limit: parseInt(limit)
    });

    const formattedData = topItems.map(item => ({
      name: item.menuItem.name,
      quantity: parseInt(item.dataValues.totalQuantity),
      revenue: parseFloat(item.dataValues.totalRevenue)
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error getting top selling items:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving top selling items',
      error: error.message
    });
  }
};

// Get category breakdown
const getCategoryBreakdown = async (req, res) => {
  try {
    const { period = 'today', status = 'all', customStart, customEnd } = req.query;
    
    const orderWhere = buildWhereClause(period, status, status, customStart, customEnd);

    const categoryBreakdown = await OrderItem.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhere,
          attributes: []
        },
        {
          model: MenuItem,
          as: 'menuItem',
          include: [{
            model: Category,
            as: 'category',
            attributes: ['name']
          }],
          attributes: []
        }
      ],
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('order.id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.literal('quantity * "unitPrice"')), 'revenue'],
        [Sequelize.col('menuItem->category.name'), 'categoryName']
      ],
      group: ['menuItem->category.id', 'menuItem->category.name'],
      order: [[Sequelize.literal('SUM(quantity * "unitPrice")'), 'DESC']]
    });

    const totalRevenue = categoryBreakdown.reduce((sum, item) => 
      sum + parseFloat(item.dataValues.revenue || 0), 0
    );

    const formattedData = categoryBreakdown.map(item => {
      const revenue = parseFloat(item.dataValues.revenue || 0);
      return {
        category: item.dataValues.categoryName,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        revenue: revenue,
        orders: parseInt(item.dataValues.orderCount)
      };
    });

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error getting category breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving category breakdown',
      error: error.message
    });
  }
};

// Get staff performance
const getStaffPerformance = async (req, res) => {
  try {
    const { period = 'today', customStart, customEnd } = req.query;
    
    const { startDate, endDate } = getDateRange(period, customStart, customEnd);

    const staffPerformance = await Staff.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        },
        {
          model: Delivery,
          as: 'deliveries',
          include: [{
            model: Order,
            as: 'order',
            where: {
              createdAt: {
                [Op.between]: [startDate, endDate]
              }
            },
            attributes: ['total']
          }],
          required: false
        }
      ],
      attributes: ['id', 'employeeId']
    });

    const formattedData = staffPerformance.map(staff => {
      const deliveries = staff.deliveries || [];
      const orders = deliveries.map(delivery => delivery.order).filter(order => order);
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      return {
        name: `${staff.user.firstName} ${staff.user.lastName}`,
        orders: orders.length,
        revenue: totalRevenue,
        rating: 4.5 // This could be calculated from feedback if available
      };
    });

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error getting staff performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving staff performance',
      error: error.message
    });
  }
};

// Get customer analytics
const getCustomerAnalytics = async (req, res) => {
  try {
    const { period = 'today', customStart, customEnd } = req.query;
    
    const { startDate, endDate } = getDateRange(period, customStart, customEnd);

    // Get orders in the period
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['customerId', 'createdAt']
    });

    // Get customers who had their first order in this period
    const allCustomerFirstOrders = await Order.findAll({
      attributes: [
        'customerId',
        [Sequelize.fn('MIN', Sequelize.col('createdAt')), 'firstOrderDate']
      ],
      group: ['customerId']
    });

    const newCustomersInPeriod = allCustomerFirstOrders.filter(customer => {
      const firstOrderDate = new Date(customer.dataValues.firstOrderDate);
      return firstOrderDate >= startDate && firstOrderDate <= endDate;
    });

    const uniqueCustomersInPeriod = new Set(orders.map(order => order.customerId));
    const returningCustomers = uniqueCustomersInPeriod.size - newCustomersInPeriod.length;

    // Calculate retention rate (customers who ordered again after their first order in this period)
    const retentionRate = newCustomersInPeriod.length > 0 ? 
      (returningCustomers / newCustomersInPeriod.length) * 100 : 0;

    // Average orders per customer
    const avgOrdersPerCustomer = uniqueCustomersInPeriod.size > 0 ? 
      orders.length / uniqueCustomersInPeriod.size : 0;

    res.json({
      success: true,
      data: {
        newCustomers: newCustomersInPeriod.length,
        returningCustomers: returningCustomers,
        retentionRate: retentionRate,
        avgOrdersPerCustomer: avgOrdersPerCustomer
      }
    });

  } catch (error) {
    console.error('Error getting customer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer analytics',
      error: error.message
    });
  }
};

// Get period summary with daily averages
const getPeriodSummary = async (req, res) => {
  try {
    const { period = 'this_month', category = 'all', status = 'all', customStart, customEnd } = req.query;
    
    const { startDate, endDate } = getDateRange(period, customStart, customEnd);
    const orderWhere = {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    };

    if (status !== 'all') {
      orderWhere.status = status;
    }

    const categoryWhere = buildCategoryWhereClause(category);
    const includeOptions = [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [{
          model: MenuItem,
          as: 'menuItem',
          include: [{
            model: Category,
            as: 'category',
            where: categoryWhere,
            required: category !== 'all'
          }]
        }]
      }
    ];

    const orders = await Order.findAll({
      where: orderWhere,
      include: includeOptions
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.customerId)).size;

    // Calculate number of days in period
    const daysDifference = moment(endDate).diff(moment(startDate), 'days') + 1;

    res.json({
      success: true,
      data: {
        dailyAverages: {
          revenue: totalRevenue / daysDifference,
          orders: totalOrders / daysDifference,
          customers: uniqueCustomers / daysDifference
        }
      }
    });

  } catch (error) {
    console.error('Error getting period summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving period summary',
      error: error.message
    });
  }
};

// Export report functionality
const exportReport = async (req, res) => {
  try {
    const { 
      format = 'pdf', 
      reportType = 'sales',
      type,
      period = 'today', 
      category = 'all', 
      status = 'all', 
      customStart, 
      customEnd 
    } = req.body;

    // Use 'type' parameter if provided, otherwise use 'reportType'
    const actualReportType = type || reportType;

    // Generate report data based on type
    let reportData = {};
    
    switch (actualReportType) {
      case 'sales':
        // Get all key metrics
        const metricsReq = { query: { period, category, status, customStart, customEnd } };
        const metricsRes = { json: (data) => { reportData.metrics = data.data; } };
        await getMetrics(metricsReq, metricsRes);
        break;
      case 'orders':
        const salesReq = { query: { period, category, status, customStart, customEnd } };
        const salesRes = { json: (data) => { reportData.sales = data.data; } };
        await getTopSellingItems(salesReq, salesRes);
        break;
      case 'customer':
        const catReq = { query: { period, status, customStart, customEnd } };
        const catRes = { json: (data) => { reportData.categories = data.data; } };
        await getCategoryBreakdown(catReq, catRes);
        break;
    }

    const fileName = `report_${actualReportType}_${Date.now()}.${format}`;
    const filePath = path.join(__dirname, '../exports', fileName);

    // Ensure exports directory exists
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    if (format === 'pdf') {
      await generatePDFReport(reportData, filePath, actualReportType);
    } else if (format === 'excel') {
      await generateExcelReport(reportData, filePath, actualReportType);
    }

    // Save report record to database
    await Reports.create({
      reportType: actualReportType,
      reportName: `${actualReportType.charAt(0).toUpperCase() + actualReportType.slice(1)} Report`,
      parameters: { period, category, status, customStart, customEnd },
      data: reportData,
      generatedBy: req.user.id,
      startDate: customStart || null,
      endDate: customEnd || null,
      status: 'completed',
      fileUrl: `/exports/${fileName}`
    });

    res.json({
      success: true,
      message: 'Report generated successfully',
      downloadUrl: `/api/reports/download/${fileName}`
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
};

// Generate PDF report
const generatePDFReport = async (data, filePath, reportType) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Food Delivery Report', 50, 50);
      doc.fontSize(12).text(`Report Type: ${reportType}`, 50, 80);
      doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')}`, 50, 95);

      let yPosition = 130;

      // Add data based on report type
      if (data.metrics) {
        doc.fontSize(16).text('Key Metrics', 50, yPosition);
        yPosition += 25;
        doc.fontSize(12)
          .text(`Revenue: $${data.metrics.revenue.toFixed(2)}`, 50, yPosition)
          .text(`Orders: ${data.metrics.orders}`, 50, yPosition + 15)
          .text(`Customers: ${data.metrics.customers}`, 50, yPosition + 30)
          .text(`Avg Order Value: $${data.metrics.avgOrderValue.toFixed(2)}`, 50, yPosition + 45)
          .text(`Growth: ${data.metrics.growth.toFixed(2)}%`, 50, yPosition + 60);
        yPosition += 90;
      }

      if (data.sales) {
        doc.fontSize(16).text('Top Selling Items', 50, yPosition);
        yPosition += 25;
        data.sales.forEach((item, index) => {
          doc.fontSize(12).text(
            `${index + 1}. ${item.name} - Qty: ${item.quantity}, Revenue: $${item.revenue.toFixed(2)}`,
            50, yPosition
          );
          yPosition += 15;
        });
      }

      if (data.categories) {
        doc.fontSize(16).text('Category Breakdown', 50, yPosition);
        yPosition += 25;
        data.categories.forEach(cat => {
          doc.fontSize(12).text(
            `${cat.category}: ${cat.percentage.toFixed(1)}% - $${cat.revenue.toFixed(2)}`,
            50, yPosition
          );
          yPosition += 15;
        });
      }

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Excel report
const generateExcelReport = async (data, filePath, reportType) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Header
  worksheet.addRow(['Food Delivery Report']);
  worksheet.addRow([`Report Type: ${reportType}`]);
  worksheet.addRow([`Generated: ${moment().format('YYYY-MM-DD HH:mm')}`]);
  worksheet.addRow([]);

  // Add data based on report type
  if (data.metrics) {
    worksheet.addRow(['Key Metrics']);
    worksheet.addRow(['Metric', 'Value']);
    worksheet.addRow(['Revenue', `$${data.metrics.revenue.toFixed(2)}`]);
    worksheet.addRow(['Orders', data.metrics.orders]);
    worksheet.addRow(['Customers', data.metrics.customers]);
    worksheet.addRow(['Avg Order Value', `$${data.metrics.avgOrderValue.toFixed(2)}`]);
    worksheet.addRow(['Growth', `${data.metrics.growth.toFixed(2)}%`]);
    worksheet.addRow([]);
  }

  if (data.sales) {
    worksheet.addRow(['Top Selling Items']);
    worksheet.addRow(['Rank', 'Item Name', 'Quantity', 'Revenue']);
    data.sales.forEach((item, index) => {
      worksheet.addRow([index + 1, item.name, item.quantity, item.revenue]);
    });
    worksheet.addRow([]);
  }

  if (data.categories) {
    worksheet.addRow(['Category Breakdown']);
    worksheet.addRow(['Category', 'Percentage', 'Revenue', 'Orders']);
    data.categories.forEach(cat => {
      worksheet.addRow([cat.category, `${cat.percentage.toFixed(1)}%`, cat.revenue, cat.orders]);
    });
  }

  await workbook.xlsx.writeFile(filePath);
};

// Download report file
const downloadReport = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../exports', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found'
      });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading report',
      error: error.message
    });
  }
};

// Get saved reports
const getSavedReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, reportType } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (reportType) {
      whereClause.reportType = reportType;
    }

    const reports = await Reports.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'generator',
        attributes: ['firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        reports: reports.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(reports.count / limit),
          totalReports: reports.count,
          hasNextPage: page * limit < reports.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting saved reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving saved reports',
      error: error.message
    });
  }
};

module.exports = {
  getMetrics,
  getHourlySales,
  getMonthlyTrend,
  getTopSellingItems,
  getCategoryBreakdown,
  getStaffPerformance,
  getCustomerAnalytics,
  getPeriodSummary,
  exportReport,
  downloadReport,
  getSavedReports
};
