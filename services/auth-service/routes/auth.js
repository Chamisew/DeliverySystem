const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validator = require('validator');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  console.log('=== Registration Request ===');
  console.log('Headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Log the extracted data
    console.log('Extracted registration data:', {
      name,
      email,
      hasPassword: !!password,
      role,
      phone,
      address
    });

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields:', {
        name: !name,
        email: !email,
        password: !password
      });
      return res.status(400).json({ 
        message: 'Missing required fields',
        missing: {
          name: !name,
          email: !email,
          password: !password
        }
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Password too short:', password.length);
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        passwordLength: password.length
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ 
        message: 'Invalid email format',
        email
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'customer',
      phone,
      address,
    });

    console.log('Attempting to save user:', {
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    await user.save();
    console.log('User saved successfully');

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('JWT token generated');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      message: error.message,
      stack: error.stack
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log('=== Login Request ===');
  console.log('Headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  try {
    const { email, password } = req.body;

    console.log('Attempting login for email:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user.email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is deactivated:', user.email);
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      message: error.message,
      stack: error.stack
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    console.log('=== /me Endpoint Request ===');
    console.log('Headers:', req.headers);
    
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Extract token from Authorization header
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    console.log('Extracted token:', token ? 'Token exists' : 'No token');
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', { userId: decoded.userId || decoded._id, role: decoded.role });
      
      // Find the user
      const user = await User.findById(decoded.userId || decoded._id).select('-password');
      
      if (!user) {
        console.log('User not found for ID:', decoded.userId || decoded._id);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log('User found:', { id: user._id, name: user.name, role: user.role });
      res.json(user);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify token and get user data
router.get('/verify', async (req, res) => {
  try {
    console.log('=== Token Verification Request ===');
    console.log('Headers:', req.headers);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded);

      // Get the user data
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('User not found for ID:', decoded.userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });

      res.json({ user });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Token verification failed' });
  }
});

module.exports = router; 