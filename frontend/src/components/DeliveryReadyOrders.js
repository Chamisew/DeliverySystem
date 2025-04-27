import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DeliveryReadyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const fetchReadyOrders = async () => {
    try {
      const response = await axios.get('/api/delivery/ready', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch ready orders');
      setLoading(false);
      console.error('Error fetching ready orders:', err);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await axios.post(`/api/delivery/${orderId}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Refresh the orders list
      fetchReadyOrders();
      // Navigate to current orders
      navigate('/delivery/current');
    } catch (err) {
      console.error('Error accepting order:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading ready orders...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ready Orders for Delivery
      </Typography>
      
      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No orders are ready for delivery at the moment.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} md={6} key={order._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </Typography>
                    <Chip 
                      label={`₹${order.totalAmount}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Customer Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary={order.user.name}
                        secondary={`Phone: ${order.user.phone}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Delivery Address"
                        secondary={order.deliveryAddress}
                      />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Restaurant Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary={order.restaurant.name}
                        secondary={order.restaurant.address}
                      />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Order Items
                  </Typography>
                  <List dense>
                    {order.items.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={`${item.quantity}x ${item.name}`}
                          secondary={`₹${item.price} each`}
                        />
                        {item.specialInstructions && (
                          <Typography variant="caption" color="text.secondary">
                            Note: {item.specialInstructions}
                          </Typography>
                        )}
                      </ListItem>
                    ))}
                  </List>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleAcceptOrder(order._id)}
                    >
                      Accept Order
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DeliveryReadyOrders; 