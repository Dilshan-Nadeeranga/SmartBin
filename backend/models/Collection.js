const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  bin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
    required: true
  },
  collector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['scheduled', 'requested', 'emergency', 'bulk'],
    default: 'scheduled'
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  fillLevelBefore: {
    type: Number,
    min: 0,
    max: 100
  },
  fillLevelAfter: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  wasteType: {
    general: { weight: Number, volume: Number },
    recyclable: { weight: Number, volume: Number },
    organic: { weight: Number, volume: Number },
    hazardous: { weight: Number, volume: Number }
  },
  notes: String,
  images: [String],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  payment: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    method: String
  },
  location: {
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  }
}, {
  timestamps: true
});

// Virtual for total weight
collectionSchema.virtual('totalWeight').get(function() {
  const waste = this.wasteType;
  return (waste.general?.weight || 0) + 
         (waste.recyclable?.weight || 0) + 
         (waste.organic?.weight || 0) + 
         (waste.hazardous?.weight || 0);
});

// Virtual for total volume
collectionSchema.virtual('totalVolume').get(function() {
  const waste = this.wasteType;
  return (waste.general?.volume || 0) + 
         (waste.recyclable?.volume || 0) + 
         (waste.organic?.volume || 0) + 
         (waste.hazardous?.volume || 0);
});

// Calculate collection duration
collectionSchema.methods.getDuration = function() {
  if (this.completedDate && this.scheduledDate) {
    return Math.floor((this.completedDate - this.scheduledDate) / (1000 * 60)); // in minutes
  }
  return null;
};

// Check if collection is overdue
collectionSchema.methods.isOverdue = function() {
  return this.status === 'assigned' && new Date() > this.scheduledDate;
};

module.exports = mongoose.model('Collection', collectionSchema);
