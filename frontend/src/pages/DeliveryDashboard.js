import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const DeliveryDashboard = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [readyOrders, setReadyOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    activeDeliveries: 0,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [deliveryReport, setDeliveryReport] = useState({
    deliveryTime: '',
    deliveryNotes: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('http://localhost:3004/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const allOrders = response.data;
      
      const readyOrders = allOrders.filter(order => order.status === 'ready');
      const activeOrders = allOrders.filter(order => 
        ['accepted', 'preparing', 'picked_up'].includes(order.status)
      );
      const completedOrders = allOrders.filter(order => order.status === 'delivered');

      const stats = {
        totalDeliveries: allOrders.length,
        completedDeliveries: readyOrders.length,
        activeDeliveries: activeOrders.length,
      };

      setReadyOrders(readyOrders);
      setActiveOrders(activeOrders);
      setStats(stats);

    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await axios.patch(
        `http://localhost:3004/api/orders/${orderId}/status`,
        { status: 'accepted' },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSuccess('Order accepted successfully');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to accept order');
    }
  };

  const handleSaveDeliveryReport = async () => {
    try {
      if (!deliveryReport.deliveryTime) {
        setError('Please select a delivery time');
        return;
      }

      const reportData = {
        orderId: currentOrder._id,
        deliveryPersonId: user._id,
        deliveryPersonDetails: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          _id: user._id
        },
        deliveryTime: deliveryReport.deliveryTime,
        deliveryNotes: deliveryReport.deliveryNotes,
        orderDetails: {
          items: currentOrder.items.map(item => ({
            name: item.menuItem?.name || item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: currentOrder.totalAmount,
          customer: {
            name: currentOrder.user?.name || currentOrder.userDetails?.name,
            email: currentOrder.user?.email || currentOrder.userDetails?.email,
            phone: currentOrder.user?.phone || currentOrder.userDetails?.phone
          },
          restaurant: currentOrder.restaurant,
          deliveryAddress: currentOrder.deliveryAddress
        }
      };

      await axios.post(
        'http://localhost:3004/api/deliveries',
        reportData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess('Delivery report saved successfully');
      setReportDialogOpen(false);
      setDeliveryReport({
        deliveryTime: '',
        deliveryNotes: '',
      });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save delivery report');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axios.patch(
        `http://localhost:3004/api/orders/${orderId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (status === 'delivered') {
        const order = activeOrders.find(o => o._id === orderId); 
        setCurrentOrder(order);
        setReportDialogOpen(true);

        if (order.paymentMethod === 'cash') {
          try {
            await axios.patch(
              `http://localhost:3004/api/orders/${orderId}`,
              { paymentStatus: 'paid' },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
          } catch (paymentError) {
            console.error('Failed to update payment status:', paymentError);
          }
        }
      } else {
        setSuccess('Order status updated successfully');
        fetchDashboardData();
      }
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'info';
      case 'preparing':
        return 'primary';
      case 'ready':
        return 'success';
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
        background: 'rgba(18, 18, 18, 0.95)',
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
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
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
              boxShadow: '0 2px 4px rgba(230, 81, 0, 0.3)',
            },
          }}
        >
          Delivery Dashboard
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.9)',
            mt: 2,
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}
        >
          Manage your deliveries and track orders
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: `0 4px 12px rgba(244, 67, 54, 0.4)`,
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            '& .MuiAlert-icon': {
              color: '#f44336',
            },
            '& .MuiAlert-message': {
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
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
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            '& .MuiAlert-icon': {
              color: '#4CAF50',
            },
            '& .MuiAlert-message': {
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
            },
          }}
        >
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Deliveries', value: stats.totalDeliveries },
          { label: 'Ready Deliveries', value: stats.completedDeliveries },
          { label: 'Active Deliveries', value: stats.activeDeliveries },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(10px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: 3,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.01)',
                  boxShadow: `0 12px 28px rgba(230, 81, 0, 0.2)`,
                  background: 'rgba(40, 40, 40, 0.95)',
                },
              }}
            >
              <CardContent>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography 
                  variant="h4"
                  sx={{ 
                    color: '#E65100',
                    fontWeight: 700,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs for Ready and Active Orders */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': {
              color: '#E65100',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#E65100',
          },
        }}
      >
        <Tab label="Ready Orders" />
        <Tab label="Active Deliveries" />
      </Tabs>

      {/* Ready Orders Tab */}
      {activeTab === 0 && (
        <TableContainer 
          component={Paper}
          sx={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>Order ID</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>Restaurant</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>Items</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>Customer</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>Address</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>Total Amount</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>Payment Status</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {readyOrders.map((order) => {
                const userDetails = order.userDetails || {
                  name: 'Unknown',
                  email: 'N/A',
                  phone: 'N/A'
                };
                const items = order.items || [];
                const deliveryAddress = order.deliveryAddress || 'N/A';
                return (
                  <TableRow 
                    key={order._id}
                    sx={{
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.95rem' }}>
                      #{order._id.slice(-6)}
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.95rem' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        ID: {order.restaurant || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.95rem' }}>
                      {order.items && order.items.length > 0 ? (
                        <List dense>
                          {order.items.map((item, index) => (
                            <ListItem key={index} disablePadding>
                              <ListItemText
                                primary={`${item.quantity}x ${item.name}`}
                                secondary={`Rs. ${item.price}`}
                                primaryTypographyProps={{ 
                                  sx: { 
                                    color: '#FFFFFF',
                                    fontWeight: 500,
                                    fontSize: '0.95rem'
                                  } 
                                }}
                                secondaryTypographyProps={{ 
                                  sx: { 
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '0.85rem'
                                  } 
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          No items
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.95rem' }}>
                      <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                        {userDetails.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                        Phone: {userDetails.phone}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                        Email: {userDetails.email}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.95rem' }}>
                      <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                        {order.deliveryAddress || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#E65100', fontWeight: 600, fontSize: '1rem' }}>
                      Rs. {order.totalAmount || 0}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentStatus || 'pending'}
                        color={
                          order.paymentStatus === 'completed' ? 'success' :
                          order.paymentStatus === 'failed' ? 'error' :
                          order.paymentStatus === 'refunded' ? 'warning' :
                          'default'
                        }
                        size="small"
                        sx={{
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          fontSize: '0.85rem',
                          '& .MuiChip-label': {
                            color: '#FFFFFF',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          background: 'rgba(230, 81, 0, 0.1)',
                          color: '#E65100',
                          border: '1px solid rgba(230, 81, 0, 0.3)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          '&:hover': {
                            background: 'rgba(230, 81, 0, 0.2)',
                            borderColor: '#E65100',
                          },
                        }}
                        onClick={() => handleAcceptOrder(order._id)}
                      >
                        Accept
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Active Deliveries Tab */}
      {activeTab === 1 && (
        <TableContainer 
          component={Paper}
          sx={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Order ID</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Restaurant</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeOrders.map((order) => (
                <TableRow 
                  key={order._id}
                  sx={{
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>#{order._id.slice(-6)}</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{order.restaurant || 'N/A'}</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{order.userDetails.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {order.status === 'accepted' && (
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          background: 'rgba(230, 81, 0, 0.1)',
                          color: '#E65100',
                          border: '1px solid rgba(230, 81, 0, 0.3)',
                          '&:hover': {
                            background: 'rgba(230, 81, 0, 0.2)',
                            borderColor: '#E65100',
                          },
                        }}
                        onClick={() => handleUpdateStatus(order._id, 'picked_up')}
                      >
                        Pick Up
                      </Button>
                    )}
                    {order.status === 'picked_up' && (
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          background: 'rgba(76, 175, 80, 0.1)',
                          color: '#4CAF50',
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          '&:hover': {
                            background: 'rgba(76, 175, 80, 0.2)',
                            borderColor: '#4CAF50',
                          },
                        }}
                        onClick={() => handleUpdateStatus(order._id, 'delivered')}
                      >
                        Mark as Delivered
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delivery Report Dialog */}
      <Dialog 
        open={reportDialogOpen} 
        onClose={() => setReportDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#E65100', fontWeight: 600 }}>Delivery Report</DialogTitle>
        <DialogContent>
          {currentOrder && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#E65100' }}>Order Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Order ID: #{currentOrder._id.slice(-6)}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Customer: {currentOrder.userDetails.name}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Restaurant: {currentOrder.items[0]?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Total Amount: Rs. {currentOrder.totalAmount}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Delivery Address: {currentOrder.deliveryAddress}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3, color: '#E65100' }}>Delivery Person Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Name: {user.name}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Email: {user.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Phone: {user.phone}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    ID: {user._id}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Delivery Time"
                  type="datetime-local"
                  value={deliveryReport.deliveryTime}
                  onChange={(e) => setDeliveryReport({ ...deliveryReport, deliveryTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: 'rgba(255, 255, 255, 0.9)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E65100',
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
                <TextField
                  fullWidth
                  label="Delivery Notes"
                  multiline
                  rows={2}
                  value={deliveryReport.deliveryNotes}
                  onChange={(e) => setDeliveryReport({ ...deliveryReport, deliveryNotes: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'rgba(255, 255, 255, 0.9)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E65100',
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
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReportDialogOpen(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#E65100',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveDeliveryReport} 
            variant="contained"
            sx={{
              background: 'rgba(230, 81, 0, 0.1)',
              color: '#E65100',
              border: '1px solid rgba(230, 81, 0, 0.3)',
              '&:hover': {
                background: 'rgba(230, 81, 0, 0.2)',
                borderColor: '#E65100',
              },
            }}
          >
            Save Report
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DeliveryDashboard; 