const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    try {
      // First verify the token locally
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Set user from decoded token as fallback
      req.user = {
        _id: decoded.userId || decoded._id, // Handle both formats
        role: decoded.role
      };
      
      // Try to verify with auth service
      try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.user) {
          req.user = response.data.user;
        }
      } catch (authServiceError) {
        console.warn('Auth service verification failed, using local verification:', authServiceError.message);
        // Continue with the decoded token user
      }
      
      return next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token verification failed' });
  }
};

module.exports = auth; 