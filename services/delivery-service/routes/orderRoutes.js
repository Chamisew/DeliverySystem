const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const orderService = require('../services/orderService');
const authMiddleware = require('../middleware/authMiddleware');
const Order = require('../models/Order');

// Get all orders (optional status filtering could be added here too)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Starting to fetch orders...');
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log('Found orders:', orders.length);

    if (orders.length > 0) {
      const firstOrder = orders[0];
      console.log('Raw first order:', JSON.stringify(firstOrder, null, 2));
    }

    const formattedOrders = orders.map(order => {
      console.log('Processing order:', order._id);
      return {
        _id: order._id,
        restaurant: order.restaurant,
        userDetails: order.userDetails || {
          name: 'Unknown',
          email: 'N/A',
          phone: 'N/A',
        },
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions,
          menuItemId: item.menuItemId,
        })),
        totalAmount: order.totalAmount,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      };
    });

    console.log('Sending formatted orders:', formattedOrders.length);
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get orders by status (e.g., /orders/status/ready)
router.get('/status/:status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.find({ status }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Failed to fetch orders by status', error: error.message });
  }
});

// Get order by ID
router.get('/:orderId', authMiddleware, async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID format' });
  }

  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Update order status
router.patch('/:orderId/status', authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const order = await orderService.updateOrderStatus(orderId, status);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});



// PATCH /api/orders/:orderId
router.patch('/:orderId', authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const updates = req.body;

  try {
    const order = await Order.findByIdAndUpdate(orderId, updates, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Failed to update order', error: err.message });
  }
});


// Create new order
router.post('/', async (req, res) => {
  try {
    const { user, restaurant, items, totalAmount, deliveryAddress, userDetails } = req.body;

    const order = new Order({
      user,
      restaurant,
      items,
      totalAmount,
      deliveryAddress,
      userDetails: {
        name: userDetails?.name || 'Unknown',
        email: userDetails?.email || 'unknown@example.com',
        phone: userDetails?.phone || 'N/A',
        address: userDetails?.address || 'N/A',
      },
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
