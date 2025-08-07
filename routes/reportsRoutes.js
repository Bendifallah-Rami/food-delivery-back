const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/reportsController');

// Import middleware
const { authenticateToken, authorize } = require('../middleware/auth');

// Middleware to ensure authentication for all reports
router.use(authenticateToken);

// Input validation middleware
const validateReportFilters = (req, res, next) => {
  const { period, category, status, customStart, customEnd } = req.query;
  
  const validPeriods = ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'custom'];
  const validCategories = ['all', 'main_course', 'pizza', 'appetizer', 'beverage', 'dessert', 'salad'];
  const validStatuses = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

  // Validate period
  if (period && !validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid period. Valid options: ' + validPeriods.join(', ')
    });
  }

  // Validate category
  if (category && !validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category. Valid options: ' + validCategories.join(', ')
    });
  }

  // Validate status
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Valid options: ' + validStatuses.join(', ')
    });
  }

  // Validate custom date range
  if (period === 'custom') {
    if (!customStart || !customEnd) {
      return res.status(400).json({
        success: false,
        message: 'Custom period requires both customStart and customEnd dates'
      });
    }

    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be later than end date'
      });
    }

    // Limit custom range to 1 year
    const daysDifference = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (daysDifference > 365) {
      return res.status(400).json({
        success: false,
        message: 'Custom date range cannot exceed 365 days'
      });
    }
  }

  next();
};

// Rate limiting middleware for export functionality
const rateLimit = require('express-rate-limit');
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 export requests per windowMs
  message: {
    success: false,
    message: 'Too many export requests, please try again later'
  }
});

/**
 * @route GET /api/reports/metrics
 * @desc Get KPI metrics (revenue, orders, customers, avgOrderValue, growth)
 * @access Admin/Manager
 * @query {string} period - today, yesterday, this_week, last_week, this_month, last_month, this_year, custom
 * @query {string} category - all, main_course, pizza, appetizer, beverage, dessert, salad
 * @query {string} status - all, pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled
 * @query {string} customStart - YYYY-MM-DD (required if period=custom)
 * @query {string} customEnd - YYYY-MM-DD (required if period=custom)
 */
router.get('/metrics', validateReportFilters, authorize('admin'), getMetrics);

/**
 * @route GET /api/reports/hourly-sales
 * @desc Get hourly sales breakdown for today
 * @access Admin/Manager
 * @query {string} category - Filter by category
 * @query {string} status - Filter by order status
 */
router.get('/hourly-sales', validateReportFilters, authorize('admin'), getHourlySales);

/**
 * @route GET /api/reports/monthly-trend
 * @desc Get monthly sales trend for the year
 * @access Admin
 * @query {string} category - Filter by category
 * @query {string} status - Filter by order status
 * @query {number} year - Year to analyze (defaults to current year)
 */
router.get('/monthly-trend', validateReportFilters, authorize('admin'), getMonthlyTrend);

/**
 * @route GET /api/reports/top-selling-items
 * @desc Get top selling menu items
 * @access Admin
 * @query {string} period - Time period filter
 * @query {string} category - Filter by category
 * @query {string} status - Filter by order status
 * @query {number} limit - Number of items to return (default: 10)
 */
router.get('/top-selling-items', validateReportFilters, authorize('admin'), getTopSellingItems);

/**
 * @route GET /api/reports/category-breakdown
 * @desc Get sales breakdown by category
 * @access Admin
 * @query {string} period - Time period filter
 * @query {string} status - Filter by order status
 */
router.get('/category-breakdown', validateReportFilters, authorize('admin'), getCategoryBreakdown);

/**
 * @route GET /api/reports/staff-performance
 * @desc Get staff performance metrics
 * @access Admin
 * @query {string} period - Time period filter
 */
router.get('/staff-performance', validateReportFilters, authorize('admin'), getStaffPerformance);

/**
 * @route GET /api/reports/customer-analytics
 * @desc Get customer analytics (new, returning, retention rate)
 * @access Admin
 * @query {string} period - Time period filter
 */
router.get('/customer-analytics', validateReportFilters, authorize('admin'), getCustomerAnalytics);

/**
 * @route GET /api/reports/period-summary
 * @desc Get period summary with daily averages
 * @access Admin
 * @query {string} period - Time period filter
 * @query {string} category - Filter by category
 * @query {string} status - Filter by order status
 */
router.get('/period-summary', validateReportFilters, authorize('admin'), getPeriodSummary);

/**
 * @route POST /api/reports/export
 * @desc Generate and export report in PDF or Excel format
 * @access Admin
 * @body {string} format - pdf or excel
 * @body {string} reportType - summary, sales, categories
 * @body {string} period - Time period filter
 * @body {string} category - Filter by category
 * @body {string} status - Filter by order status
 */
router.post('/export', exportLimiter, authorize('admin'), exportReport);

/**
 * @route GET /api/reports/download/:filename
 * @desc Download generated report file
 * @access Admin
 * @param {string} filename - Name of the file to download
 */
router.get('/download/:filename', authorize('admin'), downloadReport);

/**
 * @route GET /api/reports/saved
 * @desc Get list of saved reports
 * @access Admin
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 * @query {string} reportType - Filter by report type
 */
router.get('/saved', authorize('admin'), getSavedReports);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Reports service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
