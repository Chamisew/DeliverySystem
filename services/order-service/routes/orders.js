const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Order, Restaurant, User, MenuItem } = require('../models');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// Get all orders for the logged-in user
router.get('/user', auth, async (req, res) => {
  try {
    console.log('Fetching orders for user:', req.user._id);
    
    if (!req.user._id) {
      console.error('No user ID found in request');
      return res.status(401).json({ message: 'Invalid user data' });
    }

    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Found orders:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: error.message 
    });
  }
});

// Get all orders for a restaurant
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.restaurant) {
      console.error('No restaurant ID found for user:', req.user._id);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Fetching orders for restaurant:', req.user.restaurant);

    const orders = await Order.find({ restaurant: req.user.restaurant })
      .populate({
        path: 'user',
        select: 'name email phone',
        model: mongoose.model('User')
      })
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Found ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get a single order
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching order:', req.params.id, 'for user:', req.user._id);
    
    if (!req.user._id) {
      console.error('No user ID found in request');
      return res.status(401).json({ message: 'Invalid user data' });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { restaurant: req.user.restaurant }
      ]
    })
    .populate('user', 'name email phone')
    .populate('restaurant', 'name')
    .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new order with data:', req.body);
    
    if (!req.user._id) {
      console.error('No user ID found in request');
      return res.status(401).json({ message: 'Invalid user data' });
    }

    const { restaurantId, restaurant, items, deliveryAddress, paymentMethod, deliveryFee, notes } = req.body;
    
    // Use either restaurantId or restaurant field
    const restaurantIdentifier = restaurantId || restaurant;
    
    if (!restaurantIdentifier) {
      console.error('No restaurant ID provided');
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid or empty items array');
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Verify restaurant exists and is open
    try {
      console.log('Fetching restaurant:', restaurantIdentifier);
      const restaurantResponse = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantIdentifier}`
      );
      const restaurantData = restaurantResponse.data;
      console.log('Restaurant found:', restaurantData);

      if (!restaurantData.isOpen) {
        return res.status(400).json({ message: 'Restaurant is currently closed' });
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error.message);
      if (error.response) {
        console.error('Restaurant service response:', error.response.data);
      }
      return res.status(500).json({ 
        message: 'Error verifying restaurant',
        error: error.message 
      });
    }

    // Calculate total amount and verify items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      try {
        console.log('Processing item:', JSON.stringify(item, null, 2));
        console.log('Fetching menu item from:', `${process.env.RESTAURANT_SERVICE_URL}/api/menu/${item.menuItem}`);
        
        const menuItemResponse = await axios.get(
          `${process.env.RESTAURANT_SERVICE_URL}/api/menu/${item.menuItem}`
        );
        
        console.log('Menu item response:', JSON.stringify(menuItemResponse.data, null, 2));
        
        if (!menuItemResponse.data || !menuItemResponse.data._id) {
          throw new Error('Invalid menu item data received');
        }

        const menuItem = menuItemResponse.data;
        console.log('Menu item found:', JSON.stringify(menuItem, null, 2));

        if (!menuItem.isAvailable) {
          return res.status(400).json({ message: `Item ${menuItem.name} is not available` });
        }

        totalAmount += menuItem.price * item.quantity;
        
        // Create order item with all required fields
        const orderItem = {
          menuItemId: menuItem._id.toString(),
          name: menuItem.name,
          quantity: item.quantity,
          price: menuItem.price,
          specialInstructions: item.specialInstructions || ''
        };
        
        console.log('Created order item:', JSON.stringify(orderItem, null, 2));
        orderItems.push(orderItem);
      } catch (error) {
        console.error('Error processing menu item:', error.message);
        if (error.response) {
          console.error('Menu item service response:', error.response.data);
        }
        return res.status(500).json({ 
          message: 'Error processing menu item',
          error: error.message,
          details: error.response?.data
        });
      }
    }

    // Add delivery fee to total amount
    totalAmount += deliveryFee || 0;

    // Create the order with explicit payment status
    const order = new Order({
      user: req.user._id,
      restaurant: restaurantIdentifier,
      items: orderItems,
      totalAmount: totalAmount,
      deliveryFee: deliveryFee || 0,
      deliveryAddress,
      paymentMethod,
      notes,
      status: 'pending',
      // Explicitly set payment status based on payment method
      paymentStatus: paymentMethod === 'card' ? 'pending' : 'pending',
      userDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address
      }
    });

    console.log('Saving order with data:', {
      userId: order.user,
      restaurantId: order.restaurant,
      items: order.items,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus  // Log payment status
    });

    await order.save();

    // If payment method is card, create payment intent
    if (paymentMethod === 'card') {
      try {
        console.log('Creating payment intent for order:', order._id);
        const paymentResponse = await axios.post(
          `${process.env.PAYMENT_SERVICE_URL}/api/payments/create-payment-intent`,
          {
            orderId: order._id,
            amount: totalAmount,
            currency: 'lkr'
          },
          {
            headers: { 
              Authorization: req.headers.authorization,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Payment intent created:', paymentResponse.data);

        // Update order with payment intent ID
        order.paymentDetails = {
          paymentIntentId: paymentResponse.data.paymentIntentId,
          createdAt: new Date()
        };
        await order.save();

        // Return both order and payment intent
        const populatedOrder = await Order.findById(order._id)
          .populate({
            path: 'user',
            select: 'name email phone',
            model: mongoose.model('User')
          })
          .lean();

        return res.status(201).json({
          order: populatedOrder,
          paymentIntent: paymentResponse.data
        });
      } catch (paymentError) {
        console.error('Payment intent creation failed:', paymentError);
        
        // Update order status to payment failed
        order.paymentStatus = 'failed';
        await order.save();

        return res.status(400).json({
          message: 'Payment initialization failed',
          error: paymentError.response?.data?.message || paymentError.message
        });
      }
    } else {
      // For COD orders, return populated order directly
      const populatedOrder = await Order.findById(order._id)
        .populate({
          path: 'user',
          select: 'name email phone',
          model: mongoose.model('User')
        })
        .lean();

      console.log('COD order created:', {
        orderId: populatedOrder._id,
        paymentMethod: 'cash',
        paymentStatus: 'pending'
      });

      res.status(201).json(populatedOrder);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.response) {
      console.error('Service response:', error.response.data);
    }
    res.status(500).json({ 
      message: 'Error creating order',
      error: error.message 
    });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    await order.save();
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Cancel order
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only user who placed the order or restaurant owner can cancel
    if (
      order.user.toString() !== req.user._id.toString() &&
      order.restaurant.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Only pending or confirmed orders can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get orders for a restaurant
router.get('/restaurant/:id', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Verify ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch orders with proper population
    const orders = await Order.find({ restaurant: restaurant._id })
      .populate({
        path: 'user',
        select: 'name email phone',
        model: User
      })
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });

    console.log('Found orders:', orders.length);
    if (orders.length > 0) {
      console.log('Sample order data:', {
        orderId: orders[0]._id,
        userId: orders[0].user?._id,
        userName: orders[0].user?.name,
        userEmail: orders[0].user?.email
      });
    }

    // Format the orders data
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      user: order.user ? {
        _id: order.user._id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone
      } : null,
      items: order.items.map(item => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error getting restaurant orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Handle successful payment
router.post('/:orderId/payment-success', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentIntentId, amount } = req.body;

        console.log('Processing successful payment:', {
            orderId,
            paymentIntentId,
            amount
        });

        const order = await Order.findById(orderId);
        
        if (!order) {
            console.error('Order not found:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update payment status and details
        order.paymentStatus = 'paid';
        order.status = 'confirmed';  // Also confirm the order
        order.paymentDetails = {
            paymentIntentId,
            paidAt: new Date(),
            amount,
            method: order.paymentMethod,
            status: 'succeeded'
        };

        await order.save();

        console.log('Order updated successfully:', {
            orderId: order._id,
            paymentStatus: order.paymentStatus,
            orderStatus: order.status,
            paymentMethod: order.paymentMethod
        });

        res.json({
            success: true,
            message: 'Payment processed successfully',
            order: {
                _id: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentDetails: order.paymentDetails
            }
        });
    } catch (error) {
        console.error('Error processing payment success:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment success',
            error: error.message
        });
    }
});

// Handle failed payment
router.post('/:orderId/payment-failed', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentIntentId, error: paymentError } = req.body;

    console.log('Processing failed payment for order:', orderId);

    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = 'failed';
    order.status = 'cancelled'; // Cancel order if payment fails
    order.paymentDetails = {
      paymentIntentId,
      error: paymentError,
      failedAt: new Date()
    };

    await order.save();
    console.log('Order updated after failed payment:', order._id);

    res.json({ order });
  } catch (error) {
    console.error('Error processing failed payment:', error);
    res.status(500).json({
      message: 'Error processing payment failure',
      error: error.message
    });
  }
});

// Update payment status
router.post('/:orderId/update-payment', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentIntentId, paymentStatus, paidAt, amount } = req.body;

        console.log('Received payment status update request:', {
            orderId,
            paymentIntentId,
            paymentStatus,
            paidAt,
            amount
        });

        const order = await Order.findById(orderId);
        
        if (!order) {
            console.error('Order not found:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Always update to paid status when payment is successful
        order.paymentStatus = 'paid';
        order.paymentDetails = {
            paymentIntentId,
            paidAt: paidAt || new Date(),
            method: order.paymentMethod,
            amount: amount,
            status: 'succeeded'
        };

        await order.save();

        console.log('Order payment status updated successfully:', {
            orderId: order._id,
            newPaymentStatus: order.paymentStatus,
            paymentDetails: order.paymentDetails
        });

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            order: {
                _id: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentDetails: order.paymentDetails
            }
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment status',
            error: error.message
        });
    }
});

// Confirm card payment and update status
router.post('/:orderId/confirm-card-payment', auth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentIntentId } = req.body;

        console.log('Confirming card payment for order:', {
            orderId,
            paymentIntentId
        });

        const order = await Order.findById(orderId);
        
        if (!order) {
            console.error('Order not found:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify this is a card payment
        if (order.paymentMethod !== 'card') {
            return res.status(400).json({ 
                message: 'Invalid payment method. This endpoint is for card payments only.' 
            });
        }

        // Update both payment status and order status
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.paymentDetails = {
            paymentIntentId,
            paidAt: new Date(),
            method: 'card'
        };

        await order.save();

        console.log('Payment confirmed and status updated:', {
            orderId: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus
        });

        res.json({
            success: true,
            message: 'Payment confirmed and status updated',
            order: {
                _id: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentDetails: order.paymentDetails
            }
        });
    } catch (error) {
        console.error('Error confirming card payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error confirming card payment',
            error: error.message
        });
    }
});

// Update cash payment status
router.post('/:orderId/update-cash-payment', async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Received cash payment update request for order:', orderId);

        // Find and update the order in one operation
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, paymentMethod: 'cash' },
            { 
                $set: {
                    paymentStatus: 'paid',
                    paymentDetails: {
                        method: 'cash',
                        paidAt: new Date(),
                        status: 'paid',
                        updatedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedOrder) {
            console.error('Order not found or not a cash payment:', orderId);
            return res.status(404).json({ 
                success: false,
                message: 'Order not found or not a cash payment' 
            });
        }

        console.log('Successfully updated cash payment:', {
            orderId: updatedOrder._id,
            paymentStatus: updatedOrder.paymentStatus,
            status: updatedOrder.status
        });

        res.json({
            success: true,
            message: 'Cash payment status updated successfully',
            order: updatedOrder
        });

    } catch (error) {
        console.error('Error updating cash payment:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error updating cash payment status',
            error: error.message
        });
    }
});







// Update order status with payment status for cash payments
router.patch('/:orderId/status', async (req, res) => {
  try {
      const { orderId } = req.params;
      const { status } = req.body;

      console.log('Updating order status:', {
          orderId,
          newStatus: status
      });

      const order = await Order.findById(orderId);
      
      if (!order) {
          console.error('Order not found:', orderId);
          return res.status(404).json({ message: 'Order not found' });
      }

      // Update order status
      order.status = status;

      // If order is delivered and it's a cash payment, update payment status
      if (status === 'delivered' && order.paymentMethod === 'cash') {
          console.log('Updating payment status for cash payment:', orderId);
          order.paymentStatus = 'paid';
          order.paymentDetails = {
              method: 'cash',
              paidAt: new Date(),
              status: 'paid'
          };
      }

      await order.save();

      console.log('Order updated:', {
          orderId: order._id,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus
      });

      res.json({
          success: true,
          message: 'Order updated successfully',
          order: order
      });
  } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({
          success: false,
          message: 'Error updating order',
          error: error.message
      });
  }
});

module.exports = router; 