require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('./middleware/auth');
const Payment = require('./models/Payment');
const axios = require('axios');

const app = express();

// Important: Configure express to handle raw body for webhook
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create payment intent
app.post('/api/payments/create-payment-intent', auth, async (req, res) => {
  try {
    const { orderId, amount, currency = 'lkr' } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        message: 'Order ID and amount are required'
      });
    }

    console.log('Creating payment intent:', { orderId, amount, currency });

    // Create payment intent with Stripe
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
app.post('/api/payments/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log('Webhook received from Stripe:', event.type);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', {
                paymentIntentId: paymentIntent.id,
                orderId: paymentIntent.metadata.orderId,
                amount: paymentIntent.amount / 100
            });

            try {
                // First update the order status
                const orderResponse = await axios.post(
                    `${process.env.ORDER_SERVICE_URL}/api/orders/${paymentIntent.metadata.orderId}/confirm-card-payment`,
                    {
                        paymentIntentId: paymentIntent.id
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('Order payment status updated:', orderResponse.data);

                // Then save payment record
                const payment = new Payment({
                    paymentIntentId: paymentIntent.id,
                    orderId: paymentIntent.metadata.orderId,
                    userId: paymentIntent.metadata.userId,
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency,
                    status: 'succeeded',
                    paymentMethod: 'card'
                });

                await payment.save();
                console.log('Payment record saved successfully');

                res.json({ received: true });
            } catch (error) {
                console.error('Error processing payment success:', error);
                if (error.response) {
                    console.error('Error response:', error.response.data);
                }
                throw error; // Re-throw to trigger webhook retry
            }
        }
    } catch (err) {
        console.error('Webhook error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Get payment history
app.get('/payment/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add this endpoint to create checkout sessions
app.post('/api/payments/create-checkout-session', auth, async (req, res) => {
  try {
    const { orderId, items, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'lkr',
          product_data: {
            name: item.name,
          },
          unit_amount: item.amount, // Amount in smallest currency unit
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId,
        userId: req.user.id
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      message: 'Error creating checkout session',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
}); 