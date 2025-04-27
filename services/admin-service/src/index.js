const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const restaurantRoutes = require('./routes/restaurant.routes');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Database connection
mongoose.connect(process.env.RESTURENT_SERVICE_URL)
  .then(() => console.log('Connected to Restaurant Database'))
  .catch(err => console.error('Database connection error:', err));

// Routes
app.use('/api/admin/restaurants', restaurantRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
}); 