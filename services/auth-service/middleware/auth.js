const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const authHeader = req.header('Authorization');
    console.log('Auth middleware - Authorization header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('Auth middleware - Extracted token:', token ? 'Token present' : 'No token');
    
    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Auth middleware - Token decoded successfully:', { userId: decoded.userId, role: decoded.role });
      
      const user = await User.findById(decoded.userId).select('-password');
      console.log('Auth middleware - User found:', user ? 'Yes' : 'No');

      if (!user) {
        console.log('Auth middleware - User not found for token');
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        console.log('Auth middleware - User account is deactivated');
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Attach both the user object and decoded token info
      req.user = {
        ...user.toObject(),
        userId: decoded.userId // Ensure userId is available from token
      };
      
      console.log('Auth middleware - Final req.user:', {
        _id: req.user._id,
        userId: req.user.userId,
        role: req.user.role
      });
      
      next();
    } catch (jwtError) {
      console.error('Auth middleware - JWT verification failed:', jwtError.message);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware - General error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = auth; 