const mongoose = require('mongoose');
const NotificationService = require('./NotificationService');

// Define Order Schema (matching the order service's schema)
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
    },
    userDetails: {
        name: String,
        email: String,
        phone: String,
        address: String
    }
}, { 
    timestamps: true,
    collection: 'orders' // Explicitly specify the collection name
});

// Create Order model
const Order = mongoose.model('Order', orderSchema);

class OrderWatcher {
    static async initialize() {
        try {
            console.log('[OrderWatcher] Initializing...');
            console.log('[OrderWatcher] Connecting to MongoDB...');
            
            // Connect to MongoDB with proper options
            await mongoose.connect(process.env.ORDER_DB_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            console.log('[OrderWatcher] Successfully connected to MongoDB');
            console.log('[OrderWatcher] Setting up change stream...');

            // Watch for changes in orders collection
            const changeStream = Order.watch([
                {
                    $match: {
                        'operationType': 'update',
                        'updateDescription.updatedFields.status': { $exists: true }
                    }
                }
            ], {
                fullDocument: 'updateLookup'
            });

            console.log('[OrderWatcher] Change stream setup complete');
            console.log('[OrderWatcher] Watching for order status changes...');

            changeStream.on('change', async (change) => {
                try {
                    console.log('\n[OrderWatcher] Detected status change:', {
                        orderId: change.documentKey._id,
                        newStatus: change.updateDescription.updatedFields.status
                    });

                    // The full updated document is available in change.fullDocument
                    const order = change.fullDocument;

                    if (!order) {
                        console.log('[OrderWatcher] No order document found');
                        return;
                    }

                    console.log('[OrderWatcher] Order details:', {
                        orderId: order._id,
                        status: order.status,
                        phone: order.userDetails?.phone
                    });

                    if (!order.userDetails?.phone) {
                        console.log('[OrderWatcher] No phone number found for order');
                        return;
                    }

                    // Create status-specific message
                    let message;
                    switch (order.status) {
                        case 'preparing':
                            message = `Your order #${order._id} is now being prepared in the kitchen!`;
                            break;
                        case 'ready':
                            message = `Your order #${order._id} is ready for pickup!`;
                            break;
                        case 'out_for_delivery':
                            message = `Your order #${order._id} is on its way to you!`;
                            break;
                        case 'delivered':
                            message = `Your order #${order._id} has been delivered. Enjoy your meal!`;
                            break;
                        case 'cancelled':
                            message = `Your order #${order._id} has been cancelled.`;
                            break;
                        default:
                            message = `Your order #${order._id} status has been updated to: ${order.status}`;
                    }

                    console.log('[OrderWatcher] Sending notification:', {
                        phone: order.userDetails.phone,
                        message
                    });

                    await NotificationService.sendSMS(order.userDetails.phone, message);
                    console.log('[OrderWatcher] Notification sent successfully');

                } catch (error) {
                    console.error('[OrderWatcher] Error processing status change:', error);
                }
            });

            changeStream.on('error', (error) => {
                console.error('[OrderWatcher] Change stream error:', error);
            });

        } catch (error) {
            console.error('[OrderWatcher] Initialization error:', error);
            throw error;
        }
    }
}

module.exports = OrderWatcher; 