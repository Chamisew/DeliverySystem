const jwt = require('jsonwebtoken');
const axios = require('axios');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('verifyToken middleware - Token:', token ? 'Present' : 'Missing');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified locally:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Local token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('auth middleware - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      // First try local JWT verification
      console.log('Attempting local JWT verification');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Local verification successful:', decoded);
      
      // Get user data from auth service
      let userData = null;
      try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        userData = response.data;
        console.log('Auth service user data:', userData);
      } catch (error) {
        console.error('Error fetching user data from auth service:', error.message);
        // If auth service is down, use decoded token data
        userData = decoded;
      }
      
      if (userData) {
        // Get restaurant data if user is a restaurant owner
        let restaurantId = null;
        if (userData.role === 'restaurant') {
          try {
            const restaurantResponse = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/api/restaurants/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (restaurantResponse.data) {
              restaurantId = restaurantResponse.data._id;
              console.log('Restaurant data found:', restaurantResponse.data);
            }
          } catch (error) {
            console.error('Error fetching restaurant data:', error.message);
          }
        }

        // Ensure we have a valid user ID
        const userId = userData.id || userData._id || decoded.userId;
        if (!userId) {
          console.error('No valid user ID found in response:', userData);
          return res.status(401).json({ message: 'Invalid user data' });
        }

        // Merge decoded token data with user data
        req.user = {
          ...decoded,
          ...userData,
          _id: userId,
          userId: userId,
          restaurant: restaurantId
        };
        
        console.log('Final user object:', req.user);
        return next();
      } else {
        console.log('No user data available');
        return res.status(401).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Auth verification error:', error.message);
      if (error.response?.status === 401) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      return res.status(500).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = {
  auth,
  verifyToken
}; 