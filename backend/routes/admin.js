const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getDashboardStats,
  getSystemHealth,
  generateReport,
  getBinsOverview,
  getCollectorsOverview,
  getResidentsOverview,
  updateSystemSettings,
  sendNotification
} = require('../controllers/adminController');

// Validation rules
const notificationValidation = [
  body('title').notEmpty().withMessage('Notification title is required'),
  body('message').notEmpty().withMessage('Notification message is required'),
  body('type').isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
  body('targetUsers').optional().isArray().withMessage('Target users must be an array'),
  body('targetRoles').optional().isArray().withMessage('Target roles must be an array')
];

const reportValidation = [
  body('type').isIn(['collections', 'payments', 'users', 'bins', 'routes']).withMessage('Invalid report type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format')
];

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// Dashboard and overview routes
router.get('/dashboard', getDashboardStats);
router.get('/health', getSystemHealth);
router.get('/bins-overview', getBinsOverview);
router.get('/collectors-overview', getCollectorsOverview);
router.get('/residents-overview', getResidentsOverview);

// Reports
router.post('/reports/generate', reportValidation, generateReport);

// System management
router.put('/settings', updateSystemSettings);
router.post('/notifications', notificationValidation, sendNotification);

module.exports = router;
