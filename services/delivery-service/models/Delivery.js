const mongoose = require('mongoose');
const deliveryConnection = require('../config/deliveryDb');
const Schema = mongoose.Schema;

const deliverySchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  deliveryPersonId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  deliveryPersonDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    _id: {
      type: Schema.Types.ObjectId,
      required: true
    }
  },
  deliveryTime: {
    type: Date,
    required: true
  },
  deliveryNotes: {
    type: String
  },
  orderDetails: {
    items: [{
      name: String,
      quantity: Number,
      price: Number
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    customer: {
      name: String,
      email: String,
      phone: String
    },
    restaurant: Schema.Types.Mixed,
    deliveryAddress: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'delivered', 'cancelled'],
    default: 'delivered'
  }
}, {
  timestamps: true
});

// Create the model using the delivery connection
const Delivery = deliveryConnection.model('Delivery', deliverySchema);

// Log when the model is created
console.log('Delivery model created in database:', deliveryConnection.name);

module.exports = Delivery;