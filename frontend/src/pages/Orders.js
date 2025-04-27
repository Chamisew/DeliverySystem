import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Box,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert,
  useTheme,
} from '@mui/material';
import { orderApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';

const orderStatuses = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
  'cancelled',
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading) {
        if (!isAuthenticated) {
          console.log('User not authenticated, redirecting to login');
          navigate('/login', { state: { from: '/orders' } });
        } else {
          console.log('User authenticated, fetching orders');
          await fetchOrders();
        }
      }
    };

    checkAuth();
  }, [authLoading, isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching orders for user:', user);
      const response = await orderApi.get('/orders/user');
      console.log('Orders response:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        console.log('Unauthorized, redirecting to login');
        navigate('/login', { state: { from: '/orders' } });
      } else {
        setError('Failed to fetch orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
    switch (normalizedStatus) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'preparing':
        return 'primary';
      case 'ready':
        return 'info';
      case 'picked_up':
        return 'secondary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setLoading(true);
      setError('');
      await orderApi.put(`/orders/${orderId}/cancel`);
      await fetchOrders(); // Refresh orders after cancellation
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError(error.response?.data?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
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
          Your Orders
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2,
          }}
        >
          Track and manage your orders
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

      {loading ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
        >
          <CircularProgress 
            sx={{ 
              color: '#E65100',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }} 
          />
        </Box>
      ) : orders.length === 0 ? (
        <Card 
          sx={{ 
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'rgba(30, 30, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            borderRadius: 3,
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-6px) scale(1.01)',
              boxShadow: `0 12px 28px rgba(230, 81, 0, 0.2)`,
              background: 'rgba(40, 40, 40, 0.9)',
            },
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
                mb: 2,
              }}
            >
              You haven't placed any orders yet.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/restaurants')}
              sx={{
                mt: 3,
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
              Browse Restaurants
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} key={order._id}>
              <Card
                sx={{
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'rgba(30, 30, 30, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-6px) scale(1.01)',
                    boxShadow: `0 12px 28px rgba(230, 81, 0, 0.2)`,
                    background: 'rgba(40, 40, 40, 0.9)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#E65100',
                        mb: 1,
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -4,
                          left: 0,
                          width: '40px',
                          height: '3px',
                          background: '#E65100',
                          borderRadius: '2px',
                        },
                      }}
                    >
                      Order #{order._id.slice(-6)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <AccessTimeIcon fontSize="small" />
                      {new Date(order.createdAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 3,
                        mb: 3,
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'rgba(255, 255, 255, 0.9)',
                              mb: 1,
                            }}
                          >
                            Delivery Address
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <LocationOnIcon fontSize="small" />
                            {order.deliveryAddress}
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'rgba(255, 255, 255, 0.9)',
                              mb: 1,
                            }}
                          >
                            Payment Method
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <PaymentIcon fontSize="small" />
                            {order.paymentMethod}
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'rgba(255, 255, 255, 0.9)',
                              mb: 1,
                            }}
                          >
                            Status
                          </Typography>
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status)}
                            sx={{ 
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              height: '32px',
                              borderRadius: '16px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                              },
                              '& .MuiChip-label': {
                                px: 2,
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        mb: 2,
                      }}
                    >
                      Order Items
                    </Typography>
                    {order.items.map((item) => (
                      <Box 
                        key={item.menuItemId} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                          p: 1.5,
                          borderRadius: 1,
                          background: 'rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <span style={{ color: '#E65100' }}>×{item.quantity}</span>
                          {item.name}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.9)',
                          }}
                        >
                          Rs. {item.price * item.quantity}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      Total
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#E65100',
                      }}
                    >
                      Rs. {order.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Orders; 