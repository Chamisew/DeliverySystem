const mongoose = require('mongoose');

// Import models
const Restaurant = require('./Restaurant');
const Customer = require('./Customer');
const Order = require('./Order');

// Export models
module.exports = {
    Restaurant,
    Customer,
    Order,
    mongoose
}; 