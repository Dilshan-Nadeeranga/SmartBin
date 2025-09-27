const Route = require('../models/Route');
const Bin = require('../models/Bin');
const User = require('../models/User');
const Collection = require('../models/Collection');
const { validationResult } = require('express-validator');

// Create a new route (admin only)
const createRoute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, collector, bins, scheduledDate, estimatedDuration, isRecurring, recurrencePattern } = req.body;

    // Verify collector exists and is a collector
    const collectorUser = await User.findById(collector);
    if (!collectorUser || collectorUser.role !== 'collector') {
      return res.status(400).json({ message: 'Invalid collector' });
    }

    // Verify bins exist
    const binObjects = await Bin.find({ _id: { $in: bins.map(b => b.bin) } });
    if (binObjects.length !== bins.length) {
      return res.status(400).json({ message: 'Some bins not found' });
    }

    const route = new Route({
      name,
      description,
      collector,
      bins,
      scheduledDate,
      estimatedDuration,
      isRecurring,
      recurrencePattern
    });

    await route.save();

    // Populate the response
    await route.populate([
      { path: 'collector', select: 'name email phone' },
      { path: 'bins.bin', select: 'binId location type status' }
    ]);

    res.status(201).json({
      message: 'Route created successfully',
      route
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ message: 'Failed to create route' });
  }
};

// Get routes
const getRoutes = async (req, res) => {
  try {
    const { status, collector, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    // Filter by collector if user is a collector
    if (req.user.role === 'collector') {
      filter.collector = req.user._id;
    } else if (collector) {
      filter.collector = collector;
    }

    const routes = await Route.find(filter)
      .populate('collector', 'name email phone')
      .populate('bins.bin', 'binId location type status currentFillLevel')
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Route.countDocuments(filter);

    res.json({
      routes,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Failed to get routes' });
  }
};

// Get route by ID
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('collector', 'name email phone')
      .populate('bins.bin', 'binId location type status currentFillLevel assignedCollector')
      .populate('completedBins', 'binId location');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if user has access to this route
    const hasAccess = req.user.role === 'admin' || 
                     route.collector._id.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add calculated fields
    route.progress = route.getProgress();
    route.remainingBins = route.getRemainingBins();
    route.estimatedCompletion = route.getEstimatedCompletion();

    res.json({ route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ message: 'Failed to get route' });
  }
};

// Update route (admin only)
const updateRoute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, status, notes, bins } = req.body;
    
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (name) route.name = name;
    if (description) route.description = description;
    if (status) route.status = status;
    if (notes) route.notes = notes;
    if (bins) route.bins = bins;

    await route.save();

    await route.populate([
      { path: 'collector', select: 'name email phone' },
      { path: 'bins.bin', select: 'binId location type status' }
    ]);

    res.json({
      message: 'Route updated successfully',
      route
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ message: 'Failed to update route' });
  }
};

// Start route (collector only)
const startRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if collector owns this route
    if (route.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (route.status !== 'active') {
      return res.status(400).json({ message: 'Route is not active' });
    }

    route.status = 'in_progress';
    route.startTime = new Date();
    await route.save();

    // Emit real-time update
    req.io.to(`collector-${req.user._id}`).emit('routeStarted', {
      routeId: route._id,
      startTime: route.startTime
    });

    res.json({
      message: 'Route started successfully',
      route: {
        id: route._id,
        status: route.status,
        startTime: route.startTime
      }
    });
  } catch (error) {
    console.error('Start route error:', error);
    res.status(500).json({ message: 'Failed to start route' });
  }
};

// Complete route (collector only)
const completeRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if collector owns this route
    if (route.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    route.status = 'completed';
    route.endTime = new Date();
    route.actualDuration = route.startTime ? 
      Math.floor((route.endTime - route.startTime) / (1000 * 60)) : null;

    await route.save();

    // Update route statistics
    const collections = await Collection.find({ route: route._id });
    route.statistics.totalCollections = collections.length;
    route.statistics.totalWeight = collections.reduce((sum, c) => sum + (c.totalWeight || 0), 0);
    route.statistics.totalVolume = collections.reduce((sum, c) => sum + (c.totalVolume || 0), 0);
    route.statistics.averageTimePerBin = route.actualDuration ? 
      route.actualDuration / route.bins.length : 0;

    await route.save();

    // Emit real-time update
    req.io.to('admin').emit('routeCompleted', {
      routeId: route._id,
      endTime: route.endTime,
      actualDuration: route.actualDuration
    });

    res.json({
      message: 'Route completed successfully',
      route: {
        id: route._id,
        status: route.status,
        endTime: route.endTime,
        actualDuration: route.actualDuration
      }
    });
  } catch (error) {
    console.error('Complete route error:', error);
    res.status(500).json({ message: 'Failed to complete route' });
  }
};

// Delete route (admin only)
const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    await Route.findByIdAndDelete(req.params.id);

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ message: 'Failed to delete route' });
  }
};

// Get route statistics (admin only)
const getRouteStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await Route.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$actualDuration' },
          totalWeight: { $sum: '$statistics.totalWeight' },
          totalVolume: { $sum: '$statistics.totalVolume' }
        }
      }
    ]);

    const collectorStats = await Route.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$collector',
          completedRoutes: { $sum: 1 },
          totalDuration: { $sum: '$actualDuration' },
          avgDuration: { $avg: '$actualDuration' }
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
          completedRoutes: 1,
          totalDuration: 1,
          avgDuration: 1
        }
      },
      {
        $sort: { completedRoutes: -1 }
      }
    ]);

    res.json({
      period: parseInt(period),
      statusBreakdown: stats,
      topCollectors: collectorStats.slice(0, 10)
    });
  } catch (error) {
    console.error('Get route statistics error:', error);
    res.status(500).json({ message: 'Failed to get route statistics' });
  }
};

module.exports = {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  startRoute,
  completeRoute,
  getRouteStatistics
};
