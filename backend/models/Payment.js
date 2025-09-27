const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['subscription', 'bulk_collection', 'fine', 'premium_feature'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'digital_wallet', 'cash'],
    required: true
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  transactionId: String,
  description: String,
  metadata: {
    subscriptionType: String,
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection'
    },
    featureType: String
  },
  receipt: {
    url: String,
    number: String
  },
  refund: {
    amount: Number,
    reason: String,
    processedAt: Date,
    stripeRefundId: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discount: {
    amount: Number,
    code: String,
    type: String // 'percentage' or 'fixed'
  }
}, {
  timestamps: true
});

// Virtual for net amount after discount
paymentSchema.virtual('netAmount').get(function() {
  let amount = this.amount;
  
  if (this.discount && this.discount.amount) {
    if (this.discount.type === 'percentage') {
      amount = amount * (1 - this.discount.amount / 100);
    } else {
      amount = amount - this.discount.amount;
    }
  }
  
  return Math.max(0, amount + this.taxAmount);
});

// Check if payment is refundable
paymentSchema.methods.isRefundable = function() {
  return this.status === 'completed' && 
         new Date() - this.createdAt < (30 * 24 * 60 * 60 * 1000); // 30 days
};

// Get payment summary
paymentSchema.methods.getSummary = function() {
  return {
    id: this._id,
    amount: this.amount,
    netAmount: this.netAmount,
    status: this.status,
    type: this.type,
    date: this.createdAt,
    description: this.description
  };
};

module.exports = mongoose.model('Payment', paymentSchema);
