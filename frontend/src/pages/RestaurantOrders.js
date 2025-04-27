import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../utils/axios';
import { authApi } from '../utils/axios';

const RestaurantOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching orders for restaurant');
      
      try {
        const restaurantResponse = await restaurantApi.get('/restaurants/me', {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Restaurant response:', restaurantResponse.data);
        
        if (!restaurantResponse.data || !restaurantResponse.data._id) {
          throw new Error('No restaurant found for the current user');
        }
        
        const restaurantId = restaurantResponse.data._id;

        const response = await orderApi.get('/orders', {
          params: {
            restaurant: restaurantId
          },
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Orders response:', response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid orders data received');
        }
        
        const ordersWithDetails = response.data.map(order => {
          console.log('Order data:', order);
          
          const customer = order.userDetails ? {
            name: order.userDetails.name || 'Unknown Customer',
          } : {
            name: 'Unknown Customer',
          };

          const itemsWithDetails = order.items.map(item => ({
            ...item,
            menuItem: {
              name: item.name || 'Unknown Item',
              price: item.price
            }
          }));

          return {
            ...order,
            customer,
            items: itemsWithDetails
          };
        });
        
        setOrders(ordersWithDetails);
      } catch (error) {
        console.error('Error in fetchOrders:', error);
        if (error.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (error.response) {
          console.error('Error response:', error.response.data);
          if (error.response.status === 401) {
            setError('Authentication failed. Please log in again.');
          } else if (error.response.status === 403) {
            setError('Access denied. Please check your permissions.');
          } else {
            setError(`Failed to fetch orders: ${error.response.data.message || error.message}`);
          }
        } else {
          setError(`Failed to fetch orders: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchOrders:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      setError('');
      console.log('Updating order status:', orderId, 'to:', newStatus);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await orderApi.patch(`/orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Order status update response:', response.data);
      
      if (response.data) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        setSuccess('Order status updated successfully');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (error.response.status === 403) {
          setError('Access denied. You do not have permission to update this order.');
        } else {
          setError(`Failed to update order status: ${error.response.data.message || error.message}`);
        }
      } else {
        setError('Failed to update order status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready'
    };
    const normalizedStatus = currentStatus.toLowerCase().replace(/ /g, '_');
    return statusFlow[normalizedStatus] || null;
  };

  const getStatusDisplay = (status) => {
    const displayMap = {
      'ready': 'Ready for Pickup'
    };
    return displayMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
    switch (normalizedStatus) {
      case 'pending':
        return { bg: 'rgba(255, 152, 0, 0.2)', color: '#FF9800' };
      case 'confirmed':
        return { bg: 'rgba(33, 150, 243, 0.2)', color: '#2196F3' };
      case 'preparing':
        return { bg: 'rgba(230, 81, 0, 0.2)', color: '#E65100' };
      case 'ready':
        return { bg: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' };
      case 'picked_up':
        return { bg: 'rgba(156, 39, 176, 0.2)', color: '#9C27B0' };
      case 'delivered':
        return { bg: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' };
      case 'cancelled':
        return { bg: 'rgba(244, 67, 54, 0.2)', color: '#F44336' };
      default:
        return { bg: 'rgba(158, 158, 158, 0.2)', color: '#9E9E9E' };
    }
  };

  const canUpdateStatus = (currentStatus) => {
    const restaurantControlledStatuses = ['pending', 'confirmed', 'preparing'];
    const normalizedStatus = currentStatus.toLowerCase().replace(/ /g, '_');
    return restaurantControlledStatuses.includes(normalizedStatus);
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
        <CircularProgress sx={{ color: '#E65100' }} />
      </Box>
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
          Orders
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2,
          }}
        >
          Manage and track your restaurant orders
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

      <TableContainer 
        component={Paper}
        sx={{
          background: 'rgba(30, 30, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Order ID</TableCell>
              <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Items</TableCell>
              <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Total</TableCell>
              <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow 
                key={order._id}
                sx={{
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>#{order._id.slice(-6)}</TableCell>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {order.customer.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {order.items.map((item) => (
                    <div key={item._id}>
                      {item.quantity}x {item.menuItem?.name || 'Unknown Item'} - Rs. {item.price}
                    </div>
                  ))}
                </TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Rs. {order.totalAmount}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusDisplay(order.status)}
                    size="small"
                    sx={{
                      background: getStatusColor(order.status).bg,
                      color: getStatusColor(order.status).color,
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell>
                  {canUpdateStatus(order.status) && getNextStatus(order.status) && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleUpdateStatus(order._id, getNextStatus(order.status))}
                      disabled={loading}
                      sx={{
                        background: '#E65100',
                        '&:hover': {
                          background: '#F57C00',
                        },
                      }}
                    >
                      {getStatusDisplay(getNextStatus(order.status))}
                    </Button>
                  )}
                  {order.status.toLowerCase() === 'pending' && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#E65100', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Order Details
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#E65100', mt: 2 }}>
                Customer Information
              </Typography>
              <Typography>Name: {selectedOrder.customer?.name || 'N/A'}</Typography>
              <Typography>Email: {selectedOrder.customer?.email || 'N/A'}</Typography>
              <Typography>Delivery Address: {selectedOrder.customer?.address || 'N/A'}</Typography>

              <Typography variant="subtitle1" sx={{ mt: 2, color: '#E65100' }} gutterBottom>
                Order Items
              </Typography>
              {selectedOrder.items.map((item) => (
                <Box key={item._id} sx={{ mb: 1 }}>
                  <Typography>
                    {item.quantity}x {item.menuItem?.name || 'Unknown Item'}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Price: Rs. {item.price}
                  </Typography>
                </Box>
              ))}

              <Typography variant="subtitle1" sx={{ mt: 2, color: '#E65100' }}>
                Order Summary
              </Typography>
              <Typography>Subtotal: Rs. {selectedOrder.totalAmount - selectedOrder.deliveryFee}</Typography>
              <Typography>Delivery Fee: Rs. {selectedOrder.deliveryFee}</Typography>
              <Typography sx={{ color: '#E65100', fontWeight: 600 }}>
                Total: Rs. {selectedOrder.totalAmount}
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2, color: '#E65100' }}>
                Payment Information
              </Typography>
              <Typography>Payment Method: {selectedOrder.paymentMethod || 'N/A'}</Typography>
              <Typography>Payment Status: {selectedOrder.paymentStatus || 'N/A'}</Typography>
              
              {selectedOrder.notes && (
                <Typography variant="subtitle1" sx={{ mt: 2, color: '#E65100' }}>
                  Notes: {selectedOrder.notes}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#E65100',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RestaurantOrders; 