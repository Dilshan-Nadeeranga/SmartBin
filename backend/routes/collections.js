const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeRole, requirePremium } = require('../middleware/auth');
const {
  createCollectionRequest,
  getCollections,
  getCollectionById,
  updateCollectionStatus,
  rateCollection,
  getCollectionStatistics
} = require('../controllers/collectionController');

// Validation rules
const createCollectionValidation = [
  body('binId').isMongoId().withMessage('Valid bin ID is required'),
  body('type').isIn(['scheduled', 'requested', 'emergency', 'bulk']).withMessage('Invalid collection type'),
  body('scheduledDate').optional().isISO8601().withMessage('Valid scheduled date is required'),
  body('description').optional().isString().withMessage('Description must be a string')
];

const updateStatusValidation = [
  body('status').isIn(['assigned', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('wasteType').optional().isObject().withMessage('Waste type must be an object'),
  body('fillLevelAfter').optional().isInt({ min: 0, max: 100 }).withMessage('Fill level must be between 0 and 100'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('images').optional().isArray().withMessage('Images must be an array')
];

const ratingValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isString().withMessage('Feedback must be a string')
];

// Protected routes
router.get('/', authenticateToken, getCollections);
router.get('/statistics', authenticateToken, authorizeRole('admin'), getCollectionStatistics);
router.get('/:id', authenticateToken, getCollectionById);

// Collection request (premium residents for bulk collection)
router.post('/', authenticateToken, createCollectionValidation, createCollectionRequest);

// For bulk collection, require premium
router.post('/bulk', authenticateToken, requirePremium, createCollectionValidation, createCollectionRequest);

// Update collection status (collectors only)
router.put('/:id/status', authenticateToken, authorizeRole('collector'), updateStatusValidation, updateCollectionStatus);

// Rate collection (residents only)
router.put('/:id/rate', authenticateToken, ratingValidation, rateCollection);

module.exports = router;
