const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

// Get available orders for delivery
router.get('/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can view available orders' });
    }

    const orders = await Order.find({
      status: 'ready',
      deliveryPerson: { $exists: false },
    })
      .populate('restaurant', 'name address')
      .populate('user', 'name phone')
      .sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get delivery person's current orders
router.get('/current', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can view their current orders' });
    }

    const orders = await Order.find({
      deliveryPerson: req.user._id,
      status: { $in: ['picked_up'] },
    })
      .populate('restaurant', 'name address')
      .populate('user', 'name phone')
      .sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get delivery person's order history
router.get('/history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can view their order history' });
    }

    const orders = await Order.find({
      deliveryPerson: req.user._id,
      status: { $in: ['delivered', 'cancelled'] },
    })
      .populate('restaurant', 'name address')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept an order for delivery
router.post('/:orderId/accept', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can accept orders' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({ message: 'Order is not ready for delivery' });
    }

    if (order.deliveryPerson) {
      return res.status(400).json({ message: 'Order already assigned to a delivery person' });
    }

    order.deliveryPerson = req.user._id;
    order.status = 'picked_up';
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark order as delivered
router.post('/:orderId/delivered', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can mark orders as delivered' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.deliveryPerson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this order as delivered' });
    }

    if (order.status !== 'picked_up') {
      return res.status(400).json({ message: 'Order must be picked up before marking as delivered' });
    }

    order.status = 'delivered';
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get ready orders for delivery dashboard
router.get('/ready', auth, async (req, res) => {
  try {
    // Check if user is a delivery person
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Access denied. Delivery personnel only.' });
    }

    const readyOrders = await Order.find({ 
      status: 'ready',
      deliveryPerson: { $exists: false } // Only show orders not assigned to any delivery person
    })
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${readyOrders.length} ready orders for delivery`);

    // Format the orders data for delivery dashboard
    const formattedOrders = readyOrders.map(order => ({
      _id: order._id,
      user: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone
      },
      restaurant: {
        name: order.restaurant.name,
        address: order.restaurant.address
      },
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        specialInstructions: item.specialInstructions
      })),
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching ready orders:', error);
    res.status(500).json({ 
      message: 'Error fetching ready orders',
      error: error.message 
    });
  }
});

module.exports = router; 