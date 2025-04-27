const mongoose = require('mongoose');

// Create a separate connection for delivery reports
const deliveryConnection = mongoose.createConnection(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

deliveryConnection.on('connected', () => {
    console.log('Connected to Delivery database:', process.env.MONGODB_URI);
    console.log('Database name:', deliveryConnection.name);
});

deliveryConnection.on('error', (err) => {
    console.error('Delivery database connection error:', err);
});

module.exports = deliveryConnection;