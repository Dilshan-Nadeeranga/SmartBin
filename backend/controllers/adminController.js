const User = require('../models/User');
const Bin = require('../models/Bin');
const Collection = require('../models/Collection');
const Route = require('../models/Route');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Today's statistics
    const todayCollections = await Collection.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const todayPayments = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Overall statistics
    const totalUsers = await User.countDocuments();
    const totalBins = await Bin.countDocuments();
    const activeBins = await Bin.countDocuments({ isActive: true });
    const binsNeedingCollection = await Bin.countDocuments({
      $or: [
        { currentFillLevel: { $gte: 80 } },
        { lastCollected: { $lte: lastWeek } }
      ]
    });

    // User breakdown
    const userStats = await User.aggregate([
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

    // Recent activity
    const recentCollections = await Collection.find()
      .populate('bin', 'binId location')
      .populate('collector', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Performance metrics
    const avgCollectionTime = await Collection.aggregate([
      {
        $match: {
          status: 'completed',
          scheduledDate: { $exists: true },
          completedDate: { $exists: true }
        }
      },
      {
        $project: {
          duration: {
            $subtract: ['$completedDate', '$scheduledDate']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json({
      today: {
        collections: todayCollections,
        payments: todayPayments[0] || { totalAmount: 0, count: 0 }
      },
      overview: {
        totalUsers,
        totalBins,
        activeBins,
        binsNeedingCollection
      },
      userBreakdown: userStats,
      recentActivity: {
        collections: recentCollections,
        users: recentUsers
      },
      performance: {
        avgCollectionTimeMinutes: avgCollectionTime[0] ? 
          Math.round(avgCollectionTime[0].avgDuration / (1000 * 60)) : 0
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
};

// Get system health
const getSystemHealth = async (req, res) => {
  try {
    const health = {
      database: 'healthy',
      services: {
        email: 'healthy',
        payments: 'healthy',
        notifications: 'healthy'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };

    // Check database connection
    try {
      await User.findOne();
    } catch (error) {
      health.database = 'unhealthy';
    }

    // Check critical metrics
    const overdueCollections = await Collection.countDocuments({
      status: 'assigned',
      scheduledDate: { $lt: new Date() }
    });

    const fullBins = await Bin.countDocuments({
      currentFillLevel: { $gte: 90 }
    });

    health.alerts = [];
    if (overdueCollections > 10) {
      health.alerts.push({
        type: 'warning',
        message: `${overdueCollections} collections are overdue`
      });
    }

    if (fullBins > 20) {
      health.alerts.push({
        type: 'critical',
        message: `${fullBins} bins are overflowing`
      });
    }

    res.json(health);
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ message: 'Failed to get system health' });
  }
};

// Get bins overview
const getBinsOverview = async (req, res) => {
  try {
    const bins = await Bin.find()
      .populate('assignedCollector', 'name email')
      .sort({ currentFillLevel: -1 });

    const binsByStatus = await Bin.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const binsByType = await Bin.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgFillLevel: { $avg: '$currentFillLevel' }
        }
      }
    ]);

    res.json({
      bins,
      statusBreakdown: binsByStatus,
      typeBreakdown: binsByType,
      totalBins: bins.length
    });
  } catch (error) {
    console.error('Get bins overview error:', error);
    res.status(500).json({ message: 'Failed to get bins overview' });
  }
};

// Get collectors overview
const getCollectorsOverview = async (req, res) => {
  try {
    const collectors = await User.find({ role: 'collector' })
      .select('-password')
      .populate('statistics');

    const collectorStats = await Collection.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$collector',
          totalCollections: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalWeight: { $sum: '$totalWeight' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'collector'
        }
      },
      {
        $unwind: '$collector'
      },
      {
        $project: {
          collectorName: '$collector.name',
          collectorEmail: '$collector.email',
          totalCollections: 1,
          avgRating: 1,
          totalWeight: 1
        }
      },
      {
        $sort: { totalCollections: -1 }
      }
    ]);

    res.json({
      collectors,
      performanceStats: collectorStats
    });
  } catch (error) {
    console.error('Get collectors overview error:', error);
    res.status(500).json({ message: 'Failed to get collectors overview' });
  }
};

// Get residents overview
const getResidentsOverview = async (req, res) => {
  try {
    const residents = await User.find({
      role: { $in: ['resident', 'premium_resident'] }
    })
      .select('-password')
      .sort({ createdAt: -1 });

    const premiumStats = await User.aggregate([
      {
        $match: { role: 'premium_resident' }
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

    const residentActivity = await User.aggregate([
      {
        $match: {
          role: { $in: ['resident', 'premium_resident'] }
        }
      },
      {
        $group: {
          _id: '$statistics.totalDisposals',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': -1 }
      }
    ]);

    res.json({
      residents,
      premiumStats: premiumStats[0] || { totalPremium: 0, activePremium: 0 },
      activityBreakdown: residentActivity
    });
  } catch (error) {
    console.error('Get residents overview error:', error);
    res.status(500).json({ message: 'Failed to get residents overview' });
  }
};

// Generate reports
const generateReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, startDate, endDate, format = 'json' } = req.body;

    let reportData = {};

    switch (type) {
      case 'collections':
        reportData = await generateCollectionReport(startDate, endDate);
        break;
      case 'payments':
        reportData = await generatePaymentReport(startDate, endDate);
        break;
      case 'users':
        reportData = await generateUserReport(startDate, endDate);
        break;
      case 'bins':
        reportData = await generateBinReport(startDate, endDate);
        break;
      case 'routes':
        reportData = await generateRouteReport(startDate, endDate);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      reportType: type,
      period: { startDate, endDate },
      format,
      generatedAt: new Date(),
      data: reportData
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

// Update system settings
const updateSystemSettings = async (req, res) => {
  try {
    // This would typically update settings in a database or config file
    const { settings } = req.body;

    // For now, just return success
    res.json({
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ message: 'Failed to update system settings' });
  }
};

// Send notification
const sendNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, type, targetUsers, targetRoles } = req.body;

    // This would typically send notifications via email, SMS, or push notifications
    // For now, we'll just emit a socket event
    req.io.emit('adminNotification', {
      title,
      message,
      type,
      timestamp: new Date()
    });

    res.json({
      message: 'Notification sent successfully',
      notification: {
        title,
        message,
        type,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
};

// Helper functions for report generation
const generateCollectionReport = async (startDate, endDate) => {
  return await Collection.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: null,
        totalCollections: { $sum: 1 },
        completedCollections: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalWeight: { $sum: '$totalWeight' },
        totalVolume: { $sum: '$totalVolume' },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
};

const generatePaymentReport = async (startDate, endDate) => {
  return await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
};

const generateUserReport = async (startDate, endDate) => {
  return await User.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);
};

const generateBinReport = async (startDate, endDate) => {
  return await Bin.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgFillLevel: { $avg: '$currentFillLevel' }
      }
    }
  ]);
};

const generateRouteReport = async (startDate, endDate) => {
  return await Route.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: '$actualDuration' }
      }
    }
  ]);
};

module.exports = {
  getDashboardStats,
  getSystemHealth,
  generateReport,
  getBinsOverview,
  getCollectorsOverview,
  getResidentsOverview,
  updateSystemSettings,
  sendNotification
};
