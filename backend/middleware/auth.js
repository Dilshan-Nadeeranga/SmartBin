const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check user role
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to check if user is premium
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'premium_resident' || !req.user.isPremiumUser()) {
    return res.status(403).json({ 
      message: 'Premium subscription required for this feature' 
    });
  }

  next();
};

// Middleware to check if user owns the resource
const checkOwnership = (modelName, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resourceId = req.params[paramName];
      
      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user owns the resource or is admin
      if (resource.user && resource.user.toString() !== req.user._id.toString() && 
          req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  requirePremium,
  checkOwnership
};
