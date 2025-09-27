const Collection = require('../models/Collection');
const Bin = require('../models/Bin');
const Route = require('../models/Route');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new collection request (for premium residents)
const createCollectionRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { binId, type, scheduledDate, description, wasteDetails } = req.body;

    // Check if bin exists
    const bin = await Bin.findById(binId);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    // For bulk collection, premium users can request
    if (type === 'bulk' && req.user.role !== 'premium_resident') {
      return res.status(403).json({ 
        message: 'Bulk collection is only available for premium users' 
      });
    }

    const collection = new Collection({
      bin: binId,
      collector: bin.assignedCollector,
      resident: req.user._id,
      type,
      scheduledDate: scheduledDate || new Date(),
      description,
      wasteType: wasteDetails,
      location: bin.location,
      payment: type === 'bulk' ? {
        amount: calculateBulkCollectionFee(wasteDetails),
        status: 'pending'
      } : undefined
    });

    await collection.save();

    // Emit real-time notification
    req.io.to(`collector-${bin.assignedCollector}`).emit('newCollectionRequest', {
      collectionId: collection._id,
      bin: bin.location.name,
      type: collection.type,
      scheduledDate: collection.scheduledDate
    });

    res.status(201).json({
      message: 'Collection request created successfully',
      collection: {
        id: collection._id,
        bin: bin.location.name,
        type: collection.type,
        scheduledDate: collection.scheduledDate,
        status: collection.status,
        payment: collection.payment
      }
    });
  } catch (error) {
    console.error('Create collection request error:', error);
    res.status(500).json({ message: 'Failed to create collection request' });
  }
};

// Get collections for different user types
const getCollections = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    // Filter based on user role
    if (req.user.role === 'collector') {
      filter.collector = req.user._id;
    } else if (req.user.role === 'resident' || req.user.role === 'premium_resident') {
      filter.resident = req.user._id;
    }
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    const collections = await Collection.find(filter)
      .populate('bin', 'binId location type')
      .populate('collector', 'name email phone')
      .populate('resident', 'name email phone')
      .populate('route', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Collection.countDocuments(filter);

    res.json({
      collections,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ message: 'Failed to get collections' });
  }
};

// Get collection by ID
const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('bin', 'binId location type status currentFillLevel')
      .populate('collector', 'name email phone')
      .populate('resident', 'name email phone')
      .populate('route', 'name status');

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user has access to this collection
    const hasAccess = req.user.role === 'admin' || 
                     collection.collector._id.toString() === req.user._id.toString() ||
                     collection.resident._id.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ collection });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ message: 'Failed to get collection' });
  }
};

// Update collection status (for collectors)
const updateCollectionStatus = async (req, res) => {
  try {
    const { status, wasteType, notes, images, fillLevelAfter } = req.body;
    
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if collector owns this collection
    if (collection.collector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    collection.status = status;
    if (wasteType) collection.wasteType = wasteType;
    if (notes) collection.notes = notes;
    if (images) collection.images = images;
    if (fillLevelAfter !== undefined) collection.fillLevelAfter = fillLevelAfter;

    if (status === 'completed') {
      collection.completedDate = new Date();
      
      // Update bin status
      const bin = await Bin.findById(collection.bin);
      if (bin) {
        bin.currentFillLevel = fillLevelAfter || 0;
        bin.lastCollected = new Date();
        bin.updateStatus();
        bin.statistics.totalCollections += 1;
        await bin.save();
      }

      // Update collector statistics
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'statistics.totalCollections': 1 }
      });

      // Update route progress if assigned
      if (collection.route) {
        await Route.findByIdAndUpdate(collection.route, {
          $addToSet: { completedBins: collection.bin },
          $inc: { 'statistics.totalCollections': 1 }
        });
      }
    }

    await collection.save();

    // Emit real-time update
    req.io.to('collections').emit('collectionUpdated', {
      collectionId: collection._id,
      status: collection.status,
      completedDate: collection.completedDate
    });

    res.json({
      message: 'Collection status updated successfully',
      collection: {
        id: collection._id,
        status: collection.status,
        completedDate: collection.completedDate
      }
    });
  } catch (error) {
    console.error('Update collection status error:', error);
    res.status(500).json({ message: 'Failed to update collection status' });
  }
};

// Rate collection (for residents)
const rateCollection = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if resident owns this collection
    if (collection.resident.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    collection.rating = rating;
    if (feedback) collection.feedback = feedback;

    await collection.save();

    // Update collector's average rating
    const collections = await Collection.find({ 
      collector: collection.collector,
      rating: { $exists: true }
    });
    
    const averageRating = collections.reduce((sum, c) => sum + c.rating, 0) / collections.length;
    
    await User.findByIdAndUpdate(collection.collector, {
      'statistics.averageRating': averageRating
    });

    res.json({
      message: 'Collection rated successfully',
      collection: {
        id: collection._id,
        rating: collection.rating,
        feedback: collection.feedback
      }
    });
  } catch (error) {
    console.error('Rate collection error:', error);
    res.status(500).json({ message: 'Failed to rate collection' });
  }
};

// Get collection statistics (admin)
const getCollectionStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await Collection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalCollections: { $sum: 1 },
          totalWeight: { $sum: '$totalWeight' },
          totalVolume: { $sum: '$totalVolume' },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const typeStats = await Collection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalWeight: { $sum: '$totalWeight' }
        }
      }
    ]);

    res.json({
      period: parseInt(period),
      statistics: stats[0] || {
        totalCollections: 0,
        totalWeight: 0,
        totalVolume: 0,
        averageRating: 0
      },
      typeBreakdown: typeStats
    });
  } catch (error) {
    console.error('Get collection statistics error:', error);
    res.status(500).json({ message: 'Failed to get collection statistics' });
  }
};

// Helper function to calculate bulk collection fee
const calculateBulkCollectionFee = (wasteDetails) => {
  let baseFee = 50; // Base fee for bulk collection
  
  if (wasteDetails) {
    const { general, recyclable, organic, hazardous } = wasteDetails;
    baseFee += (general?.weight || 0) * 0.5;
    baseFee += (recyclable?.weight || 0) * 0.3;
    baseFee += (organic?.weight || 0) * 0.4;
    baseFee += (hazardous?.weight || 0) * 2.0; // Higher fee for hazardous waste
  }
  
  return Math.round(baseFee * 100) / 100; // Round to 2 decimal places
};

module.exports = {
  createCollectionRequest,
  getCollections,
  getCollectionById,
  updateCollectionStatus,
  rateCollection,
  getCollectionStatistics
};
