const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const Payment = require('../models/Payment');

// Initialize payment for an order
router.post('/create-payment-intent', auth, async (req, res) => {
    try {
        const { orderId, amount, currency = 'lkr' } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                message: 'Order ID and amount are required'
            });
        }

        console.log('Creating payment intent:', { orderId, amount, currency });

        // Create a payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to smallest currency unit (paise)
            currency,
            metadata: {
                orderId,
                userId: req.user.id
            }
        });

        console.log('Payment intent created:', paymentIntent.id);

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({
            message: 'Error creating payment',
            error: error.message
        });
    }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log('Webhook received from Stripe');
        console.log('Webhook event type:', event.type);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', {
                paymentIntentId: paymentIntent.id,
                orderId: paymentIntent.metadata.orderId
            });

            try {
                // Update order payment status
                const response = await axios.post(
                    `${process.env.ORDER_SERVICE_URL}/api/orders/${paymentIntent.metadata.orderId}/update-payment`,
                    {
                        paymentIntentId: paymentIntent.id,
                        paymentStatus: 'paid', // Explicitly set status to paid
                        paidAt: new Date(),
                        amount: paymentIntent.amount / 100
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('Order payment status updated:', response.data);
            } catch (error) {
                console.error('Error updating order payment status:', {
                    error: error.message,
                    responseData: error.response?.data
                });
                throw error; // Re-throw to trigger webhook retry
            }
        }

        res.json({received: true});
    } catch (err) {
        console.error('Webhook error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

router.post('/:orderId/update-payment', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { paymentIntentId } = req.body;
  
      console.log('Updating order payment status:', {
        orderId,
        paymentIntentId
      });
  
      const order = await Order.findById(orderId);
  
      if (!order) {
        console.error('Order not found:', orderId);
        return res.status(404).json({ message: 'Order not found' });
      }
  
      // ✅ Update both payment and delivery status
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.paymentDetails = {
        paymentIntentId,
        paidAt: new Date(),
        method: 'card'
      };
  
      await order.save();
  
      console.log('Order updated successfully:', {
        orderId: order._id,
        newPaymentStatus: order.paymentStatus
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
  
// Add this new endpoint to save payment details
router.post('/save-payment', auth, async (req, res) => {
  try {
    const { userId, orderId, amount, paymentMethod, status } = req.body;

    // Validate required fields
    if (!userId || !orderId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, orderId, amount, and paymentMethod are required'
      });
    }

    // Create new payment record
    const payment = new Payment({
      userId,
      orderId,
      amount,
      currency: 'lkr', 
      status: status || 'completed',
      paymentMethod,
      transactionId: `${paymentMethod.toUpperCase()}-${orderId}-${Date.now()}`,
    });

    // Save to payment database
    const savedPayment = await payment.save();

    console.log('Payment saved successfully:', {
      paymentId: savedPayment._id,
      orderId: savedPayment.orderId,
      status: savedPayment.status
    });

    res.status(201).json({
      success: true,
      message: 'Payment details saved successfully',
      payment: savedPayment
    });

  } catch (error) {
    console.error('Error saving payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save payment details',
      error: error.message
    });
  }
});

module.exports = router; 