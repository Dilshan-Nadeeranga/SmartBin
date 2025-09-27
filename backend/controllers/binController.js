const QRCode = require('qrcode');
const Bin = require('../models/Bin');
const Collection = require('../models/Collection');
const { validationResult } = require('express-validator');

// Create a new bin
const createBin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location, type, capacity, collectionFrequency } = req.body;

    // Generate unique bin ID
    const binId = `BIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate QR code data
    const qrData = JSON.stringify({
      binId,
      location: location.name,
      type,
      createdAt: new Date()
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const bin = new Bin({
      binId,
      qrCode,
      location,
      type,
      capacity,
      collectionFrequency
    });

    await bin.save();

    res.status(201).json({
      message: 'Bin created successfully',
      bin: {
        id: bin._id,
        binId: bin.binId,
        location: bin.location,
        type: bin.type,
        capacity: bin.capacity,
        status: bin.status,
        qrCode: bin.qrCode
      }
    });
  } catch (error) {
    console.error('Create bin error:', error);
    res.status(500).json({ message: 'Failed to create bin' });
  }
};

// Get all bins
const getAllBins = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (req.user.role === 'collector') {
      filter.assignedCollector = req.user._id;
    }

    const bins = await Bin.find(filter)
      .populate('assignedCollector', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bin.countDocuments(filter);

    res.json({
      bins,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get bins error:', error);
    res.status(500).json({ message: 'Failed to get bins' });
  }
};

// Get nearby bins for residents
const getNearbyBins = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // radius in km
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const bins = await Bin.find({ isActive: true });
    
    // Calculate distance and filter nearby bins
    const nearbyBins = bins
      .map(bin => ({
        ...bin.toObject(),
        distance: bin.calculateDistance(parseFloat(latitude), parseFloat(longitude))
      }))
      .filter(bin => bin.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Limit to 20 nearest bins

    res.json({
      bins: nearbyBins,
      userLocation: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      radius: parseFloat(radius)
    });
  } catch (error) {
    console.error('Get nearby bins error:', error);
    res.status(500).json({ message: 'Failed to get nearby bins' });
  }
};

// Get bin by ID
const getBinById = async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id)
      .populate('assignedCollector', 'name email phone')
      .populate('maintenanceHistory.performedBy', 'name email');

    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    res.json({ bin });
  } catch (error) {
    console.error('Get bin error:', error);
    res.status(500).json({ message: 'Failed to get bin' });
  }
};

// Update bin status (for residents when disposing waste)
const updateBinStatus = async (req, res) => {
  try {
    const { fillLevel, wasteType } = req.body;
    
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    // Update fill level
    bin.currentFillLevel = Math.min(bin.currentFillLevel + fillLevel, bin.capacity);
    bin.updateStatus();
    
    await bin.save();

    // Update user statistics if resident
    if (req.user.role === 'resident' || req.user.role === 'premium_resident') {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'statistics.totalDisposals': 1 },
        $set: { 'statistics.lastDisposal': new Date() }
      });
    }

    // Emit real-time update
    req.io.to('bins').emit('binUpdated', {
      binId: bin._id,
      fillLevel: bin.currentFillLevel,
      status: bin.status
    });

    res.json({
      message: 'Bin status updated successfully',
      bin: {
        id: bin._id,
        fillLevel: bin.currentFillLevel,
        status: bin.status
      }
    });
  } catch (error) {
    console.error('Update bin status error:', error);
    res.status(500).json({ message: 'Failed to update bin status' });
  }
};

// Assign collector to bin (admin only)
const assignCollector = async (req, res) => {
  try {
    const { collectorId } = req.body;
    
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    const User = require('../models/User');
    const collector = await User.findById(collectorId);
    if (!collector || collector.role !== 'collector') {
      return res.status(400).json({ message: 'Invalid collector' });
    }

    bin.assignedCollector = collectorId;
    await bin.save();

    res.json({
      message: 'Collector assigned successfully',
      bin: {
        id: bin._id,
        assignedCollector: {
          id: collector._id,
          name: collector.name,
          email: collector.email
        }
      }
    });
  } catch (error) {
    console.error('Assign collector error:', error);
    res.status(500).json({ message: 'Failed to assign collector' });
  }
};

// Get bins that need collection
const getBinsNeedingCollection = async (req, res) => {
  try {
    const bins = await Bin.find({ isActive: true });
    
    const binsNeedingCollection = bins.filter(bin => bin.needsCollection());

    res.json({
      bins: binsNeedingCollection,
      count: binsNeedingCollection.length
    });
  } catch (error) {
    console.error('Get bins needing collection error:', error);
    res.status(500).json({ message: 'Failed to get bins needing collection' });
  }
};

// Update bin (admin only)
const updateBin = async (req, res) => {
  try {
    const { location, type, capacity, collectionFrequency, isActive } = req.body;
    
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    if (location) bin.location = { ...bin.location, ...location };
    if (type) bin.type = type;
    if (capacity) bin.capacity = capacity;
    if (collectionFrequency) bin.collectionFrequency = collectionFrequency;
    if (typeof isActive === 'boolean') bin.isActive = isActive;

    await bin.save();

    res.json({
      message: 'Bin updated successfully',
      bin
    });
  } catch (error) {
    console.error('Update bin error:', error);
    res.status(500).json({ message: 'Failed to update bin' });
  }
};

// Delete bin (admin only)
const deleteBin = async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    await Bin.findByIdAndDelete(req.params.id);

    res.json({ message: 'Bin deleted successfully' });
  } catch (error) {
    console.error('Delete bin error:', error);
    res.status(500).json({ message: 'Failed to delete bin' });
  }
};

module.exports = {
  createBin,
  getAllBins,
  getNearbyBins,
  getBinById,
  updateBinStatus,
  assignCollector,
  getBinsNeedingCollection,
  updateBin,
  deleteBin
};
