import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Grid,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LocalOffer as PriceIcon,
  Timer as TimerIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const RestaurantMenu = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isAvailable: true,
    preparationTime: 15,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      fetchRestaurantAndMenuItems();
    }
  }, [user]);

  const fetchRestaurantAndMenuItems = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get or create the restaurant
      let restaurant;
      try {
        console.log('Fetching or creating restaurant...');
        const restaurantResponse = await restaurantApi.get('/restaurants/me');
        console.log('Restaurant response:', restaurantResponse.data);
        
        if (!restaurantResponse.data || !restaurantResponse.data._id) {
          throw new Error('Failed to get or create restaurant');
        }
        
        restaurant = restaurantResponse.data;
        setRestaurantId(restaurant._id);
        console.log('Got restaurant with ID:', restaurant._id);
      } catch (error) {
        console.error('Error with restaurant:', error);
        setError('Failed to get or create restaurant. Please try again.');
        setLoading(false);
        return;
      }

      // Now fetch the menu items using the restaurant ID
      try {
        console.log('Fetching menu items for restaurant:', restaurant._id);
        const menuResponse = await restaurantApi.get(`/menu/restaurant/${restaurant._id}`);
        console.log('Menu items response:', menuResponse.data);
        
        setMenuItems(menuResponse.data || []);
      } catch (error) {
        console.error('Error fetching menu items:', error);
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
          setError('Menu items not found. Please add some menu items.');
        } else {
          setError(`Failed to fetch menu items: ${error.response?.data?.message || error.message}`);
        }
      }
    } catch (error) {
      console.error('Error in fetchRestaurantAndMenuItems:', error);
      setError(`Failed to fetch data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image || '',
        isAvailable: item.isAvailable,
        preparationTime: item.preparationTime || 15,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        isAvailable: true,
        preparationTime: 15,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormData({
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'isAvailable' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!restaurantId) {
      setError('Restaurant ID is not available. Please try again.');
      return;
    }

    try {
      const menuItemData = {
        ...formData,
        price: Number(formData.price),
        preparationTime: Number(formData.preparationTime),
        restaurant: restaurantId,
      };

      if (selectedItem) {
        await restaurantApi.put(`/menu/${selectedItem._id}`, menuItemData);
        setSuccess('Menu item updated successfully');
      } else {
        await restaurantApi.post('/menu', menuItemData);
        setSuccess('Menu item created successfully');
      }

      handleCloseDialog();
      fetchRestaurantAndMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      setError(error.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!restaurantId) {
      setError('Restaurant ID is not available. Please try again.');
      return;
    }

    try {
      console.log('Deleting menu item:', itemId, 'for restaurant:', restaurantId);
      
      // Send the restaurantId in the body of the DELETE request
      await restaurantApi.delete(`/menu/${itemId}`, {
        data: { restaurant: restaurantId }
      });

      setSuccess('Menu item deleted successfully');
      fetchRestaurantAndMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to delete this menu item.');
      } else if (error.response?.status === 404) {
        setError('Menu item not found.');
      } else {
        setError(`Failed to delete menu item: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleToggleAvailability = async (itemId, currentAvailability) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await restaurantApi.put(`/menu/${itemId}/availability`, {
        isAvailable: !currentAvailability
      });
      
      if (response.data) {
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item._id === itemId 
              ? { ...item, isAvailable: !currentAvailability }
              : item
          )
        );
        setSuccess('Menu item availability updated successfully');
      }
    } catch (error) {
      console.error('Error updating menu item availability:', error);
      setError(error.response?.data?.message || 'Failed to update menu item availability');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <Box>
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

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h5"
          sx={{
            color: '#E65100',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
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
          Menu Items
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
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
          Add New Item
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search menu items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            color: 'rgba(255, 255, 255, 0.95)',
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
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={3}>
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(30, 30, 30, 0.95)',
                backdropFilter: 'blur(10px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(230, 81, 0, 0.2)',
                  borderColor: 'rgba(230, 81, 0, 0.3)',
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontWeight: 600,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Chip
                    label={item.isAvailable ? 'Available' : 'Unavailable'}
                    size="small"
                    onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                    sx={{
                      background: item.isAvailable
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(244, 67, 54, 0.2)',
                      color: item.isAvailable ? '#4CAF50' : '#F44336',
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': {
                        background: item.isAvailable
                          ? 'rgba(76, 175, 80, 0.3)'
                          : 'rgba(244, 67, 54, 0.3)',
                      },
                    }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 2,
                    minHeight: '40px',
                  }}
                >
                  {item.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={item.category}
                    size="small"
                    icon={<CategoryIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
                    sx={{
                      background: 'rgba(230, 81, 0, 0.2)',
                      color: '#E65100',
                      fontWeight: 600,
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimerIcon sx={{ color: '#E65100', fontSize: '1.2rem' }} />
                    <Typography
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 500,
                      }}
                    >
                      {item.preparationTime} min
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                  <Typography
                    sx={{
                      color: '#E65100',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <PriceIcon sx={{ fontSize: '1.2rem' }} />
                    Rs. {item.price.toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Item">
                      <IconButton
                        onClick={() => handleOpenDialog(item)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#E65100',
                            background: 'rgba(230, 81, 0, 0.1)',
                          },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Item">
                      <IconButton
                        onClick={() => handleDeleteMenuItem(item._id)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#F44336',
                            background: 'rgba(244, 67, 54, 0.1)',
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredItems.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            mt: 4,
            p: 4,
            background: 'rgba(30, 30, 30, 0.8)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            No menu items found
          </Typography>
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
                required
              >
                <MenuItem value="Appetizers">Appetizers</MenuItem>
                <MenuItem value="Main Course">Main Course</MenuItem>
                <MenuItem value="Desserts">Desserts</MenuItem>
                <MenuItem value="Beverages">Beverages</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Image URL"
              name="image"
              value={formData.image}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Preparation Time (minutes)"
              name="preparationTime"
              type="number"
              value={formData.preparationTime}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedItem ? 'Update' : 'Add'} Menu Item
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RestaurantMenu; 