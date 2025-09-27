const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  collector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bins: [{
    bin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bin'
    },
    order: Number,
    estimatedTime: Number // in minutes
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: Date,
  endTime: Date,
  estimatedDuration: Number, // in minutes
  actualDuration: Number, // in minutes
  totalDistance: Number, // in kilometers
  completedBins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin'
  }],
  statistics: {
    totalCollections: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    averageTimePerBin: { type: Number, default: 0 }
  },
  notes: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly']
    },
    days: [Number], // 0-6 for days of week
    interval: Number // for bi-weekly, monthly
  },
  nextScheduledDate: Date
}, {
  timestamps: true
});

// Calculate route progress
routeSchema.methods.getProgress = function() {
  if (this.bins.length === 0) return 0;
  return Math.round((this.completedBins.length / this.bins.length) * 100);
};

// Get remaining bins
routeSchema.methods.getRemainingBins = function() {
  return this.bins.filter(binRef => 
    !this.completedBins.includes(binRef.bin)
  );
};

// Calculate estimated completion time
routeSchema.methods.getEstimatedCompletion = function() {
  const remainingBins = this.getRemainingBins();
  const avgTimePerBin = this.statistics.averageTimePerBin || 10; // default 10 minutes
  const estimatedMinutes = remainingBins.length * avgTimePerBin;
  
  return new Date(Date.now() + estimatedMinutes * 60 * 1000);
};

// Check if route is overdue
routeSchema.methods.isOverdue = function() {
  return this.status === 'active' && 
         this.scheduledDate < new Date() && 
         this.getProgress() < 100;
};

module.exports = mongoose.model('Route', routeSchema);
