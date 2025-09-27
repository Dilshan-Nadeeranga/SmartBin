const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');
const Collection = require('../models/Collection');
const { validationResult } = require('express-validator');

// Create payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, type, description, metadata } = req.body;

    // Create payment record
    const payment = new Payment({
      user: req.user._id,
      type,
      amount,
      description,
      metadata,
      paymentMethod: 'card'
    });

    await payment.save();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        paymentId: payment._id.toString(),
        userId: req.user._id.toString(),
        type: type
      },
      description: description || `${type} payment`
    });

    payment.stripePaymentIntentId = paymentIntent.id;
    payment.status = 'processing';
    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      amount: payment.amount
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
};

// Confirm payment
const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      payment.status = 'completed';
      payment.stripeChargeId = paymentIntent.latest_charge;
      payment.transactionId = paymentIntent.id;
      
      await payment.save();

      // Handle post-payment actions based on type
      await handlePostPaymentActions(payment, req.user);

      res.json({
        message: 'Payment confirmed successfully',
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          type: payment.type
        }
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      res.status(400).json({
        message: 'Payment failed',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
};

// Get user's payments
const getPayments = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Failed to get payments' });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Failed to get payment' });
  }
};

// Refund payment
const refundPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, reason } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment or is admin
    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!payment.isRefundable()) {
      return res.status(400).json({ message: 'Payment is not refundable' });
    }

    const refundAmount = amount ? Math.round(amount * 100) : undefined; // Convert to cents

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        paymentId: payment._id.toString(),
        reason: reason
      }
    });

    // Update payment record
    payment.refund.amount = refundAmount ? refundAmount / 100 : payment.amount;
    payment.refund.reason = reason;
    payment.refund.processedAt = new Date();
    payment.refund.stripeRefundId = refund.id;
    payment.status = 'refunded';

    await payment.save();

    res.json({
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: payment.refund.amount,
        reason: payment.refund.reason,
        processedAt: payment.refund.processedAt
      }
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ message: 'Failed to process refund' });
  }
};

// Get payment statistics
const getPaymentStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const userFilter = req.user.role === 'admin' ? {} : { user: req.user._id };

    const stats = await Payment.aggregate([
      {
        $match: {
          ...userFilter,
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    const typeStats = await Payment.aggregate([
      {
        $match: {
          ...userFilter,
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    const monthlyStats = await Payment.aggregate([
      {
        $match: {
          ...userFilter,
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      period: parseInt(period),
      summary: stats[0] || { totalAmount: 0, totalPayments: 0, averageAmount: 0 },
      typeBreakdown: typeStats,
      monthlyTrend: monthlyStats
    });
  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({ message: 'Failed to get payment statistics' });
  }
};

// Helper function to handle post-payment actions
const handlePostPaymentActions = async (payment, user) => {
  try {
    switch (payment.type) {
      case 'subscription':
        // Upgrade user to premium
        user.role = 'premium_resident';
        user.isPremium = true;
        user.premiumExpiry = new Date();
        user.premiumExpiry.setFullYear(user.premiumExpiry.getFullYear() + 1); // 1 year subscription
        await user.save();
        break;

      case 'bulk_collection':
        // Update collection payment status
        if (payment.metadata.collectionId) {
          await Collection.findByIdAndUpdate(payment.metadata.collectionId, {
            'payment.status': 'completed',
            'payment.transactionId': payment.transactionId
          });
        }
        break;

      case 'premium_feature':
        // Handle premium feature activation
        // Implementation depends on specific feature
        break;

      default:
        break;
    }
  } catch (error) {
    console.error('Post-payment action error:', error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPayments,
  getPaymentById,
  refundPayment,
  getPaymentStatistics
};
