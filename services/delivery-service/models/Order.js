const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Ensure referenced models are registered
require('./Restaurant');
require('./User');

const orderItemSchema = new Schema({
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: String,
  quantity: Number,
  price: Number,
  specialInstructions: String,
  menuItemId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem'
  }
});

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [orderItemSchema],
  totalAmount: Number,
  deliveryAddress: String,
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'accepted', 'picked_up', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryPersonId: { type: Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  userDetails: {
    name: String,
    email: String,
    phone: String,
    address: String
  }
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema); 
module.exports = Order;
