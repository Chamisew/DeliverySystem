require('dotenv').config();
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Start server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Delivery Service running on port ${PORT}`);
});
