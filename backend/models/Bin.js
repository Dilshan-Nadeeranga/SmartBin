const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    name: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    address: String,
    landmark: String
  },
  type: {
    type: String,
    enum: ['general', 'recyclable', 'organic', 'hazardous'],
    default: 'general'
  },
  capacity: {
    type: Number,
    required: true,
    default: 100 // in percentage
  },
  currentFillLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['empty', 'partial', 'full', 'overflowing', 'maintenance'],
    default: 'empty'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastCollected: Date,
  collectionFrequency: {
    type: Number,
    default: 7 // days
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  statistics: {
    totalCollections: { type: Number, default: 0 },
    averageFillLevel: { type: Number, default: 0 },
    lastWeekCollections: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Update status based on fill level
binSchema.methods.updateStatus = function() {
  if (this.currentFillLevel >= 90) {
    this.status = 'overflowing';
  } else if (this.currentFillLevel >= 75) {
    this.status = 'full';
  } else if (this.currentFillLevel >= 25) {
    this.status = 'partial';
  } else {
    this.status = 'empty';
  }
  this.lastUpdated = new Date();
};

// Check if bin needs collection
binSchema.methods.needsCollection = function() {
  const daysSinceLastCollection = this.lastCollected ? 
    Math.floor((new Date() - this.lastCollected) / (1000 * 60 * 60 * 24)) : 
    this.collectionFrequency;
  
  return this.currentFillLevel >= 80 || daysSinceLastCollection >= this.collectionFrequency;
};

// Calculate distance from user location
binSchema.methods.calculateDistance = function(userLat, userLng) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = this.toRadians(this.location.coordinates.latitude - userLat);
  const dLng = this.toRadians(this.location.coordinates.longitude - userLng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRadians(userLat)) * Math.cos(this.toRadians(this.location.coordinates.latitude)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

binSchema.methods.toRadians = function(degrees) {
  return degrees * (Math.PI / 180);
};

module.exports = mongoose.model('Bin', binSchema);
