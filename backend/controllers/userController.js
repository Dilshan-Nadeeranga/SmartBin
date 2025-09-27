const User = require('../models/User');
const Collection = require('../models/Collection');
const { validationResult } = require('express-validator');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has access (own profile or admin)
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, address, role, isPremium, premiumExpiry } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (role) user.role = role;
    if (typeof isPremium === 'boolean') user.isPremium = isPremium;
    if (premiumExpiry) user.premiumExpiry = premiumExpiry;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPremium: user.isPremiumUser(),
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Deactivate user (admin only)
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Failed to deactivate user' });
  }
};

// Activate user (admin only)
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Failed to activate user' });
  }
};

// Get user statistics (admin only)
const getUserStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get user counts by role
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    // Get premium user stats
    const premiumStats = await User.aggregate([
      {
        $match: {
          role: 'premium_resident',
          isPremium: true
        }
      },
      {
        $group: {
          _id: null,
          totalPremium: { $sum: 1 },
          activePremium: {
            $sum: { 
              $cond: [
                { $and: ['$isActive', { $gt: ['$premiumExpiry', new Date()] }] },
                1, 
                0
              ]
            }
          }
        }
      }
    ]);

    // Get recent registrations
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get user activity stats
    const activeUsers = await User.countDocuments({
      'statistics.lastDisposal': { $gte: startDate }
    });

    res.json({
      period: parseInt(period),
      roleBreakdown: roleStats,
      premiumStats: premiumStats[0] || { totalPremium: 0, activePremium: 0 },
      recentRegistrations,
      activeUsers,
      totalUsers: await User.countDocuments()
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ message: 'Failed to get user statistics' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  getUserStatistics
};
