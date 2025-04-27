import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Rating
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, ShoppingCart as CartIcon } from '@mui/icons-material';
import { restaurantApi, orderApi } from '../utils/axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Add these constants at the top of your file
const DELIVERY_FEE = 50; // Fixed delivery fee of Rs50

const RestaurantDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cart, setCart] = useState([]);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: localStorage.getItem('lastDeliveryAddress') || '',
    paymentMethod: 'cash',
    notes: '',
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('Restaurant ID is required');
      setLoading(false);
      return;
    }
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      console.log('Fetching restaurant data for ID:', id);
      const [restaurantRes, menuRes] = await Promise.all([
        restaurantApi.get(`/restaurants/${id}`),
        restaurantApi.get(`/restaurants/${id}/menu`),
      ]);

      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      setError('Failed to fetch restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.menuItemId === item._id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.menuItemId === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { 
        menuItemId: item._id, 
        quantity: 1, 
        price: item.price,
        name: item.name,
        image: item.image,
        restaurantId: id,
        restaurantName: restaurant.name
      }];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.menuItemId !== itemId));
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    console.log('Updating quantity for item:', itemId, 'to:', newQuantity);
    if (newQuantity < 1) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menuItemId === itemId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.menuItemId === itemId ? { ...item, quantity: newQuantity } : item
        );
      } else {
        const menuItem = menuItems.find((item) => item._id === itemId);
        if (menuItem) {
          return [...prevCart, { menuItemId: itemId, quantity: newQuantity, price: menuItem.price }];
        }
      }
      return prevCart;
    });
  };

  // Calculate subtotal and total
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = subtotal + DELIVERY_FEE;

  const handlePlaceOrder = async () => {
    try {
      if (!id) {
        setError('Restaurant ID is missing');
        return;
      }

      if (!user) {
        setError('Please login to place an order');
        return;
      }

      if (cart.length === 0) {
        setError('Your cart is empty');
        return;
      }

      if (!orderForm.deliveryAddress) {
        setError('Please enter delivery address');
        return;
      }

      // Save the delivery address to localStorage for future use
      localStorage.setItem('lastDeliveryAddress', orderForm.deliveryAddress);

      const orderData = {
        restaurantId: restaurant._id,
        items: cart.map(item => ({
          menuItem: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || ''
        })),
        totalAmount,
        deliveryFee: DELIVERY_FEE,
        deliveryAddress: orderForm.deliveryAddress,
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes
      };

      console.log('Placing order with data:', orderData);
      
      const response = await orderApi.post('/orders', orderData);
      console.log('Order response:', response.data);

      if (orderForm.paymentMethod === 'card') {
        // For card payments, show payment form
        setPaymentIntent(response.data.paymentIntent);
        // Don't close dialog yet - wait for payment completion
      } else {
        // For cash payments, clear cart and show success
        setSuccess('Order placed successfully!');
        setCart([]);
        localStorage.removeItem('cart');
        setOpenOrderDialog(false);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || 'Failed to place order');
    }
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      // Only load cart if it's from the same restaurant
      if (parsedCart.length > 0 && parsedCart[0].restaurantId === id) {
        setCart(parsedCart);
      }
    }
  }, [id]);

  // Payment form component
  const PaymentForm = ({ paymentIntent, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
      event.preventDefault();
      
      if (!stripe || !elements) {
        return;
      }

      setProcessing(true);

      try {
        const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
          paymentIntent.clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
            },
          }
        );

        if (error) {
          onError(error.message);
        } else {
          onSuccess(confirmedPayment);
        }
      } catch (err) {
        onError('Payment processing failed');
      } finally {
        setProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }} />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={!stripe || processing}
          sx={{ mt: 2 }}
        >
          {processing ? <CircularProgress size={24} /> : 'Pay Now'}
        </Button>
      </form>
    );
  };

  // Add payment handling functions
  const handlePaymentSuccess = async (confirmedPayment) => {
    setSuccess('Payment successful! Order placed.');
    setCart([]);
    localStorage.removeItem('cart');
    setOpenOrderDialog(false);
  };

  const handlePaymentError = (errorMessage) => {
    setError(`Payment failed: ${errorMessage}`);
  };

  // Add this function to handle checkout
  const handleCheckout = async () => {
    try {
      // Create order first
      const orderResponse = await orderApi.post('/orders', {
        restaurantId: restaurant._id,
        items: cart.map(item => ({
          menuItem: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || ''
        })),
        totalAmount,
        deliveryFee: DELIVERY_FEE,
        deliveryAddress: orderForm.deliveryAddress,
        paymentMethod: 'card',
        notes: orderForm.notes
      });

      // Create checkout session
      const checkoutResponse = await axios.post(
        `${process.env.REACT_APP_PAYMENT_SERVICE_URL}/api/payments/create-checkout-session`,
        {
          orderId: orderResponse.data.order._id,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            amount: item.price * 100, // Convert to smallest currency unit
            currency: 'inr'
          })),
          successUrl: `${window.location.origin}/order-success?orderId=${orderResponse.data.order._id}`,
          cancelUrl: `${window.location.origin}/order-failed?orderId=${orderResponse.data.order._id}`
        },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );

      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({
        sessionId: checkoutResponse.data.sessionId
      });

    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.message || 'Failed to initiate checkout');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!restaurant) {
    return (
      <Container>
        <Alert severity="error">Restaurant not found</Alert>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 6,
        mt: 2,
        background: 'rgba(18, 18, 18, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: '#E65100',
          opacity: 0.8,
        },
      }}
    >
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{
            fontWeight: 800,
            color: '#E65100',
            textAlign: 'center',
            letterSpacing: '1px',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '4px',
              background: '#E65100',
              borderRadius: '2px',
            },
          }}
        >
          {restaurant.name}
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2,
          }}
        >
          {restaurant.description}
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: `0 4px 12px rgba(244, 67, 54, 0.4)`,
            background: 'rgba(30, 30, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            '& .MuiAlert-icon': {
              color: '#f44336',
            },
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: `0 4px 12px rgba(76, 175, 80, 0.4)`,
            background: 'rgba(30, 30, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            '& .MuiAlert-icon': {
              color: '#4CAF50',
            },
          }}
        >
          {success}
        </Alert>
      )}

      {/* Restaurant Info Card */}
      <Card
        sx={{
          mb: 4,
          background: 'rgba(30, 30, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-6px) scale(1.01)',
            boxShadow: `0 12px 28px rgba(230, 81, 0, 0.2)`,
            background: 'rgba(40, 40, 40, 0.9)',
          },
        }}
      >
        <CardMedia
          component="img"
          height="300"
          image={restaurant.image || 'https://via.placeholder.com/800x400'}
          alt={restaurant.name}
          sx={{
            objectFit: 'cover',
            filter: 'brightness(0.9)',
          }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={restaurant.cuisine}
              size="small"
              sx={{
                background: 'rgba(230, 81, 0, 0.2)',
                color: '#E65100',
                fontWeight: 600,
              }}
            />
            <Chip
              label={`${restaurant.deliveryTime} min`}
              size="small"
              sx={{
                background: 'rgba(230, 81, 0, 0.2)',
                color: '#E65100',
                fontWeight: 600,
              }}
            />
            <Chip
              label={restaurant.isOpen ? 'Open' : 'Closed'}
              size="small"
              sx={{
                background: restaurant.isOpen 
                  ? 'rgba(76, 175, 80, 0.2)' 
                  : 'rgba(244, 67, 54, 0.2)',
                color: restaurant.isOpen 
                  ? '#4CAF50' 
                  : '#F44336',
                fontWeight: 600,
              }}
            />
          </Box>
          <Typography 
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 2,
            }}
          >
            {restaurant.address}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating 
              value={restaurant.rating} 
              readOnly 
              size="small"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#E65100',
                },
                '& .MuiRating-iconEmpty': {
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 1,
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              ({restaurant.reviewCount})
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Typography 
        variant="h5" 
        gutterBottom
        sx={{
          color: '#E65100',
          mb: 3,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: '40px',
            height: '3px',
            background: '#E65100',
            borderRadius: '2px',
          },
        }}
      >
        Menu
      </Typography>
      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(30, 30, 30, 0.8)',
                backdropFilter: 'blur(10px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.01)',
                  boxShadow: `0 12px 28px rgba(230, 81, 0, 0.2)`,
                  background: 'rgba(40, 40, 40, 0.9)',
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={item.image || 'https://via.placeholder.com/400x200'}
                alt={item.name}
                sx={{
                  objectFit: 'cover',
                  filter: 'brightness(0.9)',
                }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 700,
                  }}
                >
                  {item.name}
                </Typography>
                <Typography 
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 2,
                  }}
                >
                  {item.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#E65100',
                      fontWeight: 700,
                    }}
                  >
                    Rs. {item.price}
                  </Typography>
                  {user && user.role === 'customer' && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const currentQuantity = cart.find(c => c.menuItemId === item._id)?.quantity || 0;
                          if (currentQuantity > 0) {
                            handleUpdateQuantity(item._id, currentQuantity - 1);
                          }
                        }}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#E65100',
                          },
                        }}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography 
                        sx={{ 
                          mx: 1,
                          color: 'rgba(255, 255, 255, 0.9)',
                        }}
                      >
                        {cart.find(c => c.menuItemId === item._id)?.quantity || 0}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleAddToCart(item)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#E65100',
                          },
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Box 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            right: 0, 
            p: 2, 
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            borderRadius: 2,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 1,
            }}
          >
            Cart: {cart.length} items
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#E65100',
              mb: 1,
            }}
          >
            Total: Rs. {totalAmount}
          </Typography>
          <Button
            variant="contained"
            startIcon={<CartIcon />}
            onClick={() => setOpenOrderDialog(true)}
            sx={{
              backgroundColor: '#E65100',
              '&:hover': {
                backgroundColor: '#BF360C',
              },
            }}
          >
            Place Order
          </Button>
        </Box>
      )}

      {/* Order Dialog */}
      <Dialog 
        open={openOrderDialog} 
        onClose={() => setOpenOrderDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2,
        }}>
          Place Order
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Delivery Address"
            value={orderForm.deliveryAddress}
            onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
            margin="normal"
            required
            multiline
            rows={3}
            placeholder="Enter your complete delivery address"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#E65100',
                  boxShadow: '0 0 0 2px rgba(230, 81, 0, 0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#E65100',
                },
              },
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#E65100',
                },
              }}
            >
              Payment Method
            </InputLabel>
            <Select
              value={orderForm.paymentMethod}
              onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}
              label="Payment Method"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E65100',
                  boxShadow: '0 0 0 2px rgba(230, 81, 0, 0.2)',
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    background: 'rgba(30, 30, 30, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    '& .MuiMenuItem-root': {
                      color: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(230, 81, 0, 0.1)',
                        color: '#E65100',
                      },
                      '&.Mui-selected': {
                        background: 'rgba(230, 81, 0, 0.2)',
                        color: '#E65100',
                        '&:hover': {
                          background: 'rgba(230, 81, 0, 0.3)',
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="cash">Cash on Delivery</MenuItem>
              <MenuItem value="card">Card Payment</MenuItem>
            </Select>
          </FormControl>

          {paymentIntent && orderForm.paymentMethod === 'card' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Card Payment
              </Typography>
              <Elements stripe={stripePromise}>
                <PaymentForm
                  paymentIntent={paymentIntent}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            </Box>
          )}

          <TextField
            fullWidth
            label="Notes"
            value={orderForm.notes}
            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#E65100',
                  boxShadow: '0 0 0 2px rgba(230, 81, 0, 0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#E65100',
                },
              },
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Order Summary</Typography>
            {cart.map((item) => {
              const menuItem = menuItems.find(m => m._id === item.menuItemId);
              return (
                <Box key={item.menuItemId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {menuItem?.name} x {item.quantity}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Rs. {item.price * item.quantity}</Typography>
                </Box>
              );
            })}
            <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Subtotal</Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Rs. {subtotal}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Delivery Fee</Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Rs. {DELIVERY_FEE}</Typography>
            </Box>
            <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ color: '#E65100' }}>Total</Typography>
              <Typography variant="h6" sx={{ color: '#E65100' }}>Rs. {totalAmount}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          p: 2,
        }}>
          <Button 
            onClick={() => setOpenOrderDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#E65100',
              },
            }}
          >
            Cancel
          </Button>
          {!paymentIntent && (
            <Button 
              onClick={handlePlaceOrder} 
              variant="contained" 
              sx={{
                backgroundColor: '#E65100',
                '&:hover': {
                  backgroundColor: '#BF360C',
                },
              }}
            >
              Place Order
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RestaurantDetail; 