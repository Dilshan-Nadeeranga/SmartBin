const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  createBin,
  getAllBins,
  getNearbyBins,
  getBinById,
  updateBinStatus,
  assignCollector,
  getBinsNeedingCollection,
  updateBin,
  deleteBin
} = require('../controllers/binController');

// Validation rules
const createBinValidation = [
  body('location.name').notEmpty().withMessage('Location name is required'),
  body('location.coordinates.latitude').isNumeric().withMessage('Valid latitude is required'),
  body('location.coordinates.longitude').isNumeric().withMessage('Valid longitude is required'),
  body('type').isIn(['general', 'recyclable', 'organic', 'hazardous']).withMessage('Invalid bin type'),
  body('capacity').isInt({ min: 1, max: 100 }).withMessage('Capacity must be between 1 and 100'),
  body('collectionFrequency').optional().isInt({ min: 1 }).withMessage('Collection frequency must be a positive integer')
];

const updateBinStatusValidation = [
  body('fillLevel').isInt({ min: 1, max: 100 }).withMessage('Fill level must be between 1 and 100'),
  body('wasteType').optional().isString().withMessage('Waste type must be a string')
];

const assignCollectorValidation = [
  body('collectorId').isMongoId().withMessage('Valid collector ID is required')
];

// Public routes
router.get('/nearby', getNearbyBins);

// Protected routes for all authenticated users
router.get('/', authenticateToken, getAllBins);
router.get('/needing-collection', authenticateToken, getBinsNeedingCollection);
router.get('/:id', authenticateToken, getBinById);
router.put('/:id/status', authenticateToken, updateBinStatusValidation, updateBinStatus);

// Admin only routes
router.post('/', authenticateToken, authorizeRole('admin'), createBinValidation, createBin);
router.put('/:id', authenticateToken, authorizeRole('admin'), updateBin);
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteBin);
router.put('/:id/assign-collector', authenticateToken, authorizeRole('admin'), assignCollectorValidation, assignCollector);

module.exports = router;
