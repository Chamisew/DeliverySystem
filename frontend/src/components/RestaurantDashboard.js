import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { restaurantApi } from '../utils/axios';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [openMenuDialog, setOpenMenuDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restaurant, setRestaurant] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '',
    isAvailable: true,
  });

  // Fetch restaurant data
  const fetchRestaurant = async () => {
    try {
      console.log('Fetching restaurant data...');
      const response = await restaurantApi.get('/restaurants/me');
      console.log('Restaurant data:', response.data);
      setRestaurant(response.data);
      return response.data._id;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      if (error.response?.status === 404) {
        setError('Restaurant not found. Please create a restaurant first.');
      } else {
        setError('Failed to fetch restaurant data: ' + (error.response?.data?.message || error.message));
      }
      return null;
    }
  };

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      console.log('Fetching menu items...');
      const restaurantId = await fetchRestaurant();
      if (!restaurantId) {
        setError('Restaurant ID not found');
        return;
      }
      const response = await restaurantApi.get(`/menu/restaurant/${restaurantId}`);
      console.log('Menu items:', response.data);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to fetch menu items: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleOpenMenuDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setMenuForm({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category,
        preparationTime: item.preparationTime,
        isAvailable: item.isAvailable,
      });
    } else {
      setSelectedItem(null);
      setMenuForm({
        name: '',
        description: '',
        price: '',
        category: '',
        preparationTime: '',
        isAvailable: true,
      });
    }
    setOpenMenuDialog(true);
  };

  const handleCloseMenuDialog = () => {
    setOpenMenuDialog(false);
    setSelectedItem(null);
    setMenuForm({
      name: '',
      description: '',
      price: '',
      category: '',
      preparationTime: '',
      isAvailable: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const restaurantId = restaurant?._id;
      if (!restaurantId) {
        setError('Restaurant ID not found');
        return;
      }

      // Log the form data before submission
      console.log('Submitting menu item with data:', menuForm);

      const menuData = {
        ...menuForm,
        price: Number(menuForm.price),
        preparationTime: Number(menuForm.preparationTime),
        restaurant: restaurantId
      };

      // Log the processed data
      console.log('Processed menu data:', menuData);

      if (selectedItem) {
        // Update existing menu item
        const response = await restaurantApi.put(`/menu/${selectedItem._id}`, menuData);
        console.log('Update response:', response.data);
        setSuccess('Menu item updated successfully');
      } else {
        // Create new menu item
        const response = await restaurantApi.post(`/menu/restaurant/${restaurantId}`, menuData);
        console.log('Create response:', response.data);
        setSuccess('Menu item created successfully');
      }

      // Refresh menu items
      fetchMenuItems();
      handleCloseMenuDialog();
    } catch (error) {
      console.error('Error submitting menu item:', error);
      // Log detailed error information
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      setError(error.response?.data?.message || 'Failed to submit menu item');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Restaurant Dashboard</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenMenuDialog()}
        >
          Add Menu Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography color="textSecondary">{item.description}</Typography>
                <Typography variant="body2">Price: ${item.price}</Typography>
                <Typography variant="body2">Category: {item.category}</Typography>
                <Typography variant="body2">
                  Preparation Time: {item.preparationTime} minutes
                </Typography>
                <Typography variant="body2">
                  Status: {item.isAvailable ? 'Available' : 'Unavailable'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleOpenMenuDialog(item)}
                >
                  Edit
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openMenuDialog} onClose={handleCloseMenuDialog}>
        <DialogTitle>
          {selectedItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              required
              value={menuForm.name}
              onChange={(e) =>
                setMenuForm({ ...menuForm, name: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={2}
              value={menuForm.description}
              onChange={(e) =>
                setMenuForm({ ...menuForm, description: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Price"
              type="number"
              fullWidth
              required
              value={menuForm.price}
              onChange={(e) =>
                setMenuForm({ ...menuForm, price: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Category"
              type="text"
              fullWidth
              required
              value={menuForm.category}
              onChange={(e) =>
                setMenuForm({ ...menuForm, category: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Preparation Time (minutes)"
              type="number"
              fullWidth
              required
              value={menuForm.preparationTime}
              onChange={(e) =>
                setMenuForm({ ...menuForm, preparationTime: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMenuDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RestaurantDashboard; 