require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/delivery');
const { auth, verifyToken } = require('./middleware/auth');

// Set mongoose options
mongoose.set('strictPopulate', false);

// Import models in correct order
const User = require('./models/User'); // User model must be imported first
const Restaurant = require('./models/Restaurant'); // Restaurant model depends on User
const MenuItemSchema = require('./models/MenuItem'); // MenuItem schema
const Order = require('./models/Order'); // Order model depends on both User and Restaurant

// Register models
try {
  mongoose.model('User');
} catch (error) {
  mongoose.model('User', User.schema);
}

try {
  mongoose.model('Restaurant');
} catch (error) {
  mongoose.model('Restaurant', Restaurant.schema);
}

// Register MenuItem model
if (!mongoose.models.MenuItem) {
  mongoose.model('MenuItem', MenuItemSchema);
}

try {
  mongoose.model('Order');
} catch (error) {
  mongoose.model('Order', Order.schema);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  // Verify model registration
  console.log('Registered models:', mongoose.modelNames());
})
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
}); 