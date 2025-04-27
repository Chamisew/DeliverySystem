import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  Box,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: localStorage.getItem('lastDeliveryAddress') || '',
    paymentMethod: 'cash',
    notes: '',
  });
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => 
        item.menuItemId === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      // Save to localStorage after update
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const handleRemoveItem = (itemId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.menuItemId !== itemId);
      // Save to localStorage after removal
      if (updatedCart.length > 0) {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      } else {
        localStorage.removeItem('cart');
      }
      return updatedCart;
    });
  };

  const handlePlaceOrder = () => {
    // Navigate to restaurant details page with the restaurant ID from the cart
    const restaurantId = cart[0]?.restaurantId;
    if (restaurantId) {
      navigate(`/restaurants/${restaurantId}`);
    } else {
      alert('Restaurant information not found');
    }
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  if (!cart || cart.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <CartIcon sx={{ fontSize: 80, color: theme.palette.primary.main }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Looks like you haven't added any items to your cart yet
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/restaurants')}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${theme.palette.primary.main}`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            Browse Restaurants
          </Button>
        </Box>
      </Container>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

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
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
          Shopping Cart
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2,
          }}
        >
          Review and manage your order items
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CartIcon sx={{ color: theme.palette.primary.main }} />
              Your Items ({cart.length})
            </Typography>
          </Box>
          {cart.map((item) => (
            <Card 
              key={item.menuItemId} 
              sx={{ 
                mb: 3,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'rgba(30, 30, 30, 0.8)',
                backdropFilter: 'blur(10px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: 3,
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.01)',
                  boxShadow: `0 12px 28px ${theme.palette.primary.main}20`,
                  background: 'rgba(40, 40, 40, 0.9)',
                },
              }}
            >
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Box
                      component="img"
                      src={item.image || 'https://via.placeholder.com/100x100'}
                      alt={item.name}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: 2,
                        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.5)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={9}>
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'rgba(255, 255, 255, 0.9)',
                          mb: 0.5,
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: theme.palette.primary.main,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={() => navigate(`/restaurants/${item.restaurantId}`)}
                      >
                        {item.restaurantName}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: theme.palette.primary.main,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <span style={{ fontSize: '0.8em', opacity: 0.7 }}>Rs.</span>
                        {item.price * item.quantity}
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                        sx={{
                          color: theme.palette.primary.main,
                          background: 'rgba(255, 255, 255, 0.1)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.2)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography 
                        sx={{ 
                          mx: 2, 
                          fontWeight: 600,
                          minWidth: '24px',
                          textAlign: 'center',
                          color: 'rgba(255, 255, 255, 0.9)',
                        }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                        sx={{
                          color: theme.palette.primary.main,
                          background: 'rgba(255, 255, 255, 0.1)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.2)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleRemoveItem(item.menuItemId)}
                        sx={{ 
                          ml: 'auto',
                          color: theme.palette.error.main,
                          background: 'rgba(255, 255, 255, 0.1)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.2)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              position: 'sticky',
              top: 20,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'rgba(30, 30, 30, 0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: 3,
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 28px ${theme.palette.primary.main}20`,
                background: 'rgba(40, 40, 40, 0.9)',
              },
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 700,
                  color: '#E65100',
                  textAlign: 'center',
                  mb: 3,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40px',
                    height: '3px',
                    background: '#E65100',
                    borderRadius: '2px',
                  },
                }}
              >
                Order Summary
              </Typography>
              <Box sx={{ my: 3 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Subtotal
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Rs. {subtotal}
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Delivery Fee
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Rs. {deliveryFee}
                  </Typography>
                </Box>
                <Divider 
                  sx={{ 
                    my: 2,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }} 
                />
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Total
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                    }}
                  >
                    Rs. {total}
                  </Typography>
                </Box>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handlePlaceOrder}
                sx={{
                  backgroundColor: '#E65100',
                  color: 'white',
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(230, 81, 0, 0.4)',
                  '&:hover': {
                    backgroundColor: '#BF360C',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(230, 81, 0, 0.6)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Proceed to Order
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart; 