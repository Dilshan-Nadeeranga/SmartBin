const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  role: {
    type: String,
    enum: ['resident', 'premium_resident', 'collector', 'admin'],
    default: 'resident'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiry: Date,
  subscriptionId: String,
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: String,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' }
  },
  statistics: {
    totalDisposals: { type: Number, default: 0 },
    recyclingScore: { type: Number, default: 0 },
    lastDisposal: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user's full address
userSchema.methods.getFullAddress = function() {
  const { street, city, state, zipCode } = this.address;
  return `${street}, ${city}, ${state} ${zipCode}`.trim();
};

// Check if user is premium
userSchema.methods.isPremiumUser = function() {
  return this.role === 'premium_resident' && this.isPremium && 
         (!this.premiumExpiry || this.premiumExpiry > new Date());
};

module.exports = mongoose.model('User', userSchema);
