const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  startRoute,
  completeRoute,
  getRouteStatistics
} = require('../controllers/routeController');

// Validation rules
const createRouteValidation = [
  body('name').notEmpty().withMessage('Route name is required'),
  body('collector').isMongoId().withMessage('Valid collector ID is required'),
  body('bins').isArray({ min: 1 }).withMessage('At least one bin is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('estimatedDuration').optional().isInt({ min: 1 }).withMessage('Estimated duration must be a positive integer')
];

const updateRouteValidation = [
  body('name').optional().notEmpty().withMessage('Route name cannot be empty'),
  body('status').optional().isIn(['active', 'completed', 'paused', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

// Protected routes
router.get('/', authenticateToken, getRoutes);
router.get('/statistics', authenticateToken, authorizeRole('admin'), getRouteStatistics);
router.get('/:id', authenticateToken, getRouteById);

// Admin only routes
router.post('/', authenticateToken, authorizeRole('admin'), createRouteValidation, createRoute);
router.put('/:id', authenticateToken, authorizeRole('admin'), updateRouteValidation, updateRoute);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteRoute);

// Collector routes
router.put('/:id/start', authenticateToken, authorizeRole('collector'), startRoute);
router.put('/:id/complete', authenticateToken, authorizeRole('collector'), completeRoute);

module.exports = router;
