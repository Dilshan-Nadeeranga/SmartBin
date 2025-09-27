const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  getUserStatistics
} = require('../controllers/userController');

// Validation rules
const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('role').optional().isIn(['resident', 'premium_resident', 'collector', 'admin']).withMessage('Invalid role')
];

// Protected routes
router.get('/', authenticateToken, authorizeRole('admin'), getAllUsers);
router.get('/statistics', authenticateToken, authorizeRole('admin'), getUserStatistics);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, authorizeRole('admin'), updateUserValidation, updateUser);
router.put('/:id/deactivate', authenticateToken, authorizeRole('admin'), deactivateUser);
router.put('/:id/activate', authenticateToken, authorizeRole('admin'), activateUser);

module.exports = router;
