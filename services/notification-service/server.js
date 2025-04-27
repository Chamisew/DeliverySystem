require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OrderWatcher = require('./services/orderWatcher');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3007;

// Initialize the order watcher and start the server
async function startServer() {
    try {
        console.log('[Server] Starting notification service...');
        
        // Initialize order watcher
        await OrderWatcher.initialize();
        console.log('[Server] Order watcher initialized successfully');

        // Start the server
        app.listen(PORT, () => {
            console.log(`[Server] Notification service running on port ${PORT}`);
            console.log('[Server] Environment variables:');
            console.log('- TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);
            console.log('- ORDER_DB_URL:', process.env.ORDER_DB_URL);
            console.log('- TWILIO_ACCOUNT_SID exists:', !!process.env.TWILIO_ACCOUNT_SID);
            console.log('- TWILIO_AUTH_TOKEN exists:', !!process.env.TWILIO_AUTH_TOKEN);
        });
    } catch (error) {
        console.error('[Server] Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 