const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, requirePremium } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  getPayments,
  getPaymentById,
  refundPayment,
  getPaymentStatistics
} = require('../controllers/paymentController');

// Validation rules
const createPaymentValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('type').isIn(['subscription', 'bulk_collection', 'fine', 'premium_feature']).withMessage('Invalid payment type'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

const refundValidation = [
  body('amount').optional().isNumeric().withMessage('Refund amount must be a number'),
  body('reason').notEmpty().withMessage('Refund reason is required')
];

// Protected routes
router.get('/', authenticateToken, getPayments);
router.get('/statistics', authenticateToken, getPaymentStatistics);
router.get('/:id', authenticateToken, getPaymentById);

// Payment processing
router.post('/create-intent', authenticateToken, createPaymentValidation, createPaymentIntent);
router.post('/:id/confirm', authenticateToken, confirmPayment);
router.post('/:id/refund', authenticateToken, refundValidation, refundPayment);

module.exports = router;
