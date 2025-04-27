import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import RestaurantMenu from './RestaurantMenu';
import RestaurantOrders from './RestaurantOrders';


const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    menuItems: 0,
  });
  const [restaurantId, setRestaurantId] = useState(null);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openMenuDialog, setOpenMenuDialog] = useState(false);
  const [openRestaurantDialog, setOpenRestaurantDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuFormData, setMenuFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isAvailable: true,
    preparationTime: 15,
  });
  const [restaurantFormData, setRestaurantFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    phone: '',
    openingHours: '',
    minOrder: '',
    deliveryTime: '',
    deliveryFee: '',
    image: '',
    isOpen: true,
  });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user && user.role === 'restaurant') {
    fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get or create the restaurant first
      let restaurant;
      try {
        console.log('Fetching or creating restaurant...');
      const restaurantResponse = await restaurantApi.get('/restaurants/me');
        console.log('Restaurant response:', restaurantResponse.data);
        
        if (!restaurantResponse.data || !restaurantResponse.data._id) {
          throw new Error('Failed to get or create restaurant');
        }
        
        restaurant = restaurantResponse.data;
        const restaurantId = restaurant._id;
        setHasRestaurant(true); // Set hasRestaurant to true when restaurant exists
  
        // Ensure restaurant ID is valid before proceeding
        if (!restaurantId) {
          throw new Error('Restaurant ID is not valid');
        }
  
        setRestaurantId(restaurantId);  // Set the valid restaurant ID
        console.log('Got restaurant with ID:', restaurantId);
  
        // Fetch stats, menu items, and orders only if the restaurant ID is valid
        try {
          console.log('Fetching dashboard data for restaurant:', restaurantId);
      const [statsRes, menuRes, ordersRes] = await Promise.all([
            restaurantApi.get(`/restaurants/${restaurantId}/stats`),
            restaurantApi.get(`/restaurants/${restaurantId}/menu`),
            restaurantApi.get(`/restaurants/${restaurantId}/orders`)
          ]);
  
          console.log('Dashboard data responses:', {
            stats: statsRes.data,
            menuItems: menuRes.data,
            orders: ordersRes.data
          });
  
          if (!statsRes.data) {
            throw new Error('Invalid stats data received from server');
          }
  
          // Ensure stats data is properly formatted
          const formattedStats = {
            totalOrders: statsRes.data.totalOrders || 0,
            totalRevenue: statsRes.data.totalRevenue || 0,
            activeOrders: statsRes.data.activeOrders || 0,
            menuItems: statsRes.data.menuItems || 0
          };
  
          console.log('Formatted stats:', formattedStats);
          console.log('Menu items:', menuRes.data || []);
          console.log('Orders:', ordersRes.data || []);
  
          setStats(formattedStats);
          setMenuItems(menuRes.data || []);
          setOrders(ordersRes.data || []);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          
          if (error.response?.status === 401) {
            setError('Authentication failed. Please log in again.');
          } else if (error.response?.status === 403) {
            setError('Access denied. You do not have permission to view this data.');
          } else if (error.response?.status === 404) {
            setError('Restaurant not found. Please create a restaurant first.');
          } else if (error.response?.status === 400) {
            setError(`Invalid request: ${error.response.data.message}`);
          } else {
            setError(`Failed to fetch dashboard data: ${error.response?.data?.message || error.message}`);
          }
        }
      } catch (error) {
        console.error('Error with restaurant:', error);
        setError('Failed to get or create restaurant. Please try again.');
      }
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setError(`Failed to fetch dashboard data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  

  const handleOpenRestaurantDialog = () => {
    setOpenRestaurantDialog(true);
  };

  const handleCloseRestaurantDialog = () => {
    setOpenRestaurantDialog(false);
    setRestaurantFormData({
      name: '',
      description: '',
      cuisine: '',
      address: '',
      phone: '',
      openingHours: '',
      minOrder: '',
      deliveryTime: '',
      deliveryFee: '',
      image: '',
      isOpen: true,
    });
  };

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'description', 'cuisine', 'address', 'phone', 'openingHours', 'minOrder', 'deliveryTime', 'deliveryFee'];
      const missingFields = requiredFields.filter(field => !restaurantFormData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Convert string numbers to actual numbers
      const restaurantData = {
        ...restaurantFormData,
        deliveryTime: Number(restaurantFormData.deliveryTime),
        minOrder: Number(restaurantFormData.minOrder),
        deliveryFee: Number(restaurantFormData.deliveryFee),
        owner: user.id // Add the owner ID from the authenticated user
      };

      // Validate numeric fields
      if (isNaN(restaurantData.deliveryTime) || isNaN(restaurantData.minOrder) || isNaN(restaurantData.deliveryFee)) {
        setError('Please enter valid numbers for delivery time, minimum order, and delivery fee');
        return;
      }

      console.log('Submitting restaurant data:', restaurantData);
      
      const response = await restaurantApi.post('/restaurants', restaurantData);
      console.log('Restaurant created:', response.data);
      
      setSuccess('Restaurant created successfully');
      handleCloseRestaurantDialog();
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating restaurant:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create restaurant';
      setError(errorMessage);
    }
  };

  const handleRestaurantChange = (e) => {
    const { name, value } = e.target;
    setRestaurantFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setMenuFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        isAvailable: item.isAvailable,
        preparationTime: item.preparationTime || 15,
      });
    } else {
      setSelectedItem(null);
      setMenuFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        isAvailable: true,
        preparationTime: 15,
      });
    }
    setOpenMenuDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenMenuDialog(false);
    setSelectedItem(null);
    setMenuFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      isAvailable: true,
      preparationTime: 15,
    });
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setMenuFormData((prev) => ({
      ...prev,
      [name]: name === 'isAvailable' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'price', 'category', 'preparationTime'];
      const missingFields = requiredFields.filter(field => !menuFormData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Convert string numbers to actual numbers and validate
      const menuItemData = {
        ...menuFormData,
        price: Number(menuFormData.price),
        preparationTime: Number(menuFormData.preparationTime)
      };

      // Validate numeric fields
      if (isNaN(menuItemData.price) || menuItemData.price <= 0) {
        setError('Please enter a valid price greater than 0');
        return;
      }

      if (isNaN(menuItemData.preparationTime) || menuItemData.preparationTime <= 0) {
        setError('Please enter a valid preparation time greater than 0');
        return;
      }

      // Get the restaurant ID first
      let restaurantId;
      try {
      const restaurantResponse = await restaurantApi.get('/restaurants/me');
        restaurantId = restaurantResponse.data._id;
      } catch (error) {
        console.error('Error getting restaurant ID:', error);
        setError('Failed to get restaurant information. Please try again.');
        return;
      }
      
      if (selectedItem) {
        // Update existing menu item
        await handleUpdateMenuItem(menuItemData);
      } else {
        // Create new menu item
        await handleCreateMenuItem(menuItemData);
      }
      
      handleCloseDialog();
      fetchDashboardData();
    } catch (error) {
      console.error('Error in menu item submission:', error);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
      setError(errorMessage);
    }
  };

  const handleCreateMenuItem = async (menuItemData) => {
    try {
      console.log('Creating menu item with data:', menuItemData);
      const response = await restaurantApi.post('/menu', menuItemData);
      console.log('Menu item created:', response.data);
      setSuccess('Menu item created successfully');
      fetchDashboardData();
      setOpenMenuDialog(false);
    } catch (error) {
      console.error('Error creating menu item:', error);
      setError(`Failed to create menu item: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateMenuItem = async (menuItemData) => {
    try {
      console.log('Updating menu item with data:', menuItemData);
      const response = await restaurantApi.put(`/menu/${selectedItem._id}`, menuItemData);
      console.log('Menu item updated:', response.data);
      setSuccess('Menu item updated successfully');
      fetchDashboardData();
      setOpenMenuDialog(false);
    } catch (error) {
      console.error('Error updating menu item:', error);
      setError(`Failed to update menu item: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    try {
      console.log('Deleting menu item:', itemId);
        await restaurantApi.delete(`/menu/${itemId}`);
        setSuccess('Menu item deleted successfully');
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting menu item:', error);
      setError(`Failed to delete menu item: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await restaurantApi.put(`/restaurant/orders/${orderId}/status`, {
        status,
      });
      setSuccess('Order status updated successfully');
      fetchDashboardData();
    } catch (error) {
      setError('Failed to update order status');
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Confirmed':
        return 'info';
      case 'Preparing':
        return 'primary';
      case 'Ready for Pickup':
        return 'success';
      case 'Delivered':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
          Restaurant Dashboard
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
          Manage your restaurant and orders
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

      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<RestaurantIcon />}
          onClick={handleOpenRestaurantDialog}
          disabled={hasRestaurant}
          sx={{
            backgroundColor: '#E65100',
            color: 'rgba(255, 255, 255, 0.95)',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'none',
            padding: '10px 24px',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
            '&:hover': {
              backgroundColor: '#BF360C',
              boxShadow: '0 6px 16px rgba(230, 81, 0, 0.4)',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(230, 81, 0, 0.3)',
              color: 'rgba(255, 255, 255, 0.5)',
            },
          }}
        >
          {hasRestaurant ? 'Restaurant Already Added' : 'Add Restaurant'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Orders', value: stats.totalOrders },
          { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue}` },
          { label: 'Active Orders', value: stats.activeOrders },
          { label: 'Menu Items', value: stats.menuItems },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
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
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 1,
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

      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'rgba(255, 255, 255, 0.1)',
          mb: 3,
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 500,
              letterSpacing: '0.5px',
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#E65100',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#E65100',
              height: '3px',
            },
          }}
        >
          <Tab label="Menu" />
          <Tab label="Orders" />
        </Tabs>
      </Box>

      {tabValue === 0 && <RestaurantMenu />}
      {tabValue === 1 && <RestaurantOrders />}

      {/* Restaurant Creation Dialog */}
      <Dialog 
        open={openRestaurantDialog} 
        onClose={handleCloseRestaurantDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(30, 30, 30, 0.98)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.95)',
            fontWeight: 600,
            letterSpacing: '0.5px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            pb: 2,
          }}
        >
          Add New Restaurant
        </DialogTitle>
        <form onSubmit={handleRestaurantSubmit}>
          <DialogContent>
            {[
              { name: 'name', label: 'Restaurant Name', required: true },
              { name: 'description', label: 'Description', required: true, multiline: true, rows: 3 },
              { name: 'cuisine', label: 'Cuisine', required: true },
              { name: 'address', label: 'Address', required: true },
              { name: 'phone', label: 'Phone', required: true },
              { name: 'openingHours', label: 'Opening Hours', required: true },
              { name: 'minOrder', label: 'Minimum Order', required: true, type: 'number' },
              { name: 'deliveryTime', label: 'Delivery Time (minutes)', required: true, type: 'number' },
              { name: 'deliveryFee', label: 'Delivery Fee', required: true, type: 'number' },
              { name: 'image', label: 'Image URL' },
            ].map((field) => (
              <TextField
                key={field.name}
                fullWidth
                label={field.label}
                name={field.name}
                value={restaurantFormData[field.name]}
                onChange={handleRestaurantChange}
                margin="normal"
                required={field.required}
                type={field.type}
                multiline={field.multiline}
                rows={field.rows}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'rgba(255, 255, 255, 0.95)',
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
                    color: 'rgba(255, 255, 255, 0.8)',
                    '&.Mui-focused': {
                      color: '#E65100',
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              />
            ))}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Button 
              onClick={handleCloseRestaurantDialog}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.95)',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{
                backgroundColor: '#E65100',
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'none',
                padding: '8px 24px',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
                '&:hover': {
                  backgroundColor: '#BF360C',
                  boxShadow: '0 6px 16px rgba(230, 81, 0, 0.4)',
                },
              }}
            >
              Create Restaurant
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    
      
    </Container>
  );
};

export default RestaurantDashboard; 