import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import adminService from '../services/adminService';

const AdminDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    cuisine: '',
    deliveryTime: 45,
    minOrder: 1,
    isOpen: true,
    image: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const data = await adminService.getAllRestaurants();
      setRestaurants(data);
    } catch (error) {
      showSnackbar('Error fetching restaurants', 'error');
    }
  };

  const handleOpenDialog = (restaurant = null) => {
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        cuisine: restaurant.cuisine || '',
        deliveryTime: restaurant.deliveryTime || 45,
        minOrder: restaurant.minOrder || 1,
        isOpen: restaurant.isOpen || true,
        image: restaurant.image || ''
      });
    } else {
      setSelectedRestaurant(null);
      setFormData({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        cuisine: '',
        deliveryTime: 45,
        minOrder: 1,
        isOpen: true,
        image: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRestaurant(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const restaurantData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        cuisine: formData.cuisine.trim(),
        deliveryTime: Number(formData.deliveryTime),
        minOrder: Number(formData.minOrder),
        isOpen: Boolean(formData.isOpen),
        image: formData.image.trim()
      };

      console.log('Submitting restaurant data:', restaurantData);

      if (selectedRestaurant) {
        await adminService.updateRestaurant(selectedRestaurant._id, restaurantData);
        showSnackbar('Restaurant updated successfully', 'success');
      } else {
        await adminService.createRestaurant(restaurantData);
        showSnackbar('Restaurant created successfully', 'success');
      }
      handleCloseDialog();
      fetchRestaurants();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      showSnackbar('Error saving restaurant', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await adminService.deleteRestaurant(id);
        showSnackbar('Restaurant deleted successfully', 'success');
        fetchRestaurants();
      } catch (error) {
        showSnackbar('Error deleting restaurant', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
          Restaurant Management
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2,
          }}
        >
          Manage your restaurant listings
        </Typography>
      </Box>

      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: '#E65100',
              color: 'white',
              '&:hover': {
                background: '#F57C00',
                boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
              },
            }}
          >
            Add Restaurant
          </Button>
        </Grid>
      </Grid>

      <TableContainer 
        component={Paper}
        sx={{
          background: 'rgba(30, 30, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Address</TableCell>
              <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: '#E65100', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {restaurants.map((restaurant) => (
              <TableRow 
                key={restaurant._id}
                sx={{
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{restaurant.name || 'N/A'}</TableCell>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{restaurant.description || 'N/A'}</TableCell>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{restaurant.address || 'N/A'}</TableCell>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {restaurant.phone || 'N/A'}<br />
                  {restaurant.email || 'N/A'}
                </TableCell>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpenDialog(restaurant)}
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
                  <IconButton
                    onClick={() => handleDelete(restaurant._id)}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: '#E65100',
                        background: 'rgba(230, 81, 0, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: '#E65100',
            fontWeight: 600,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {selectedRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  multiline
                  rows={3}
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cuisine"
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  required
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Delivery Time (minutes)"
                  name="deliveryTime"
                  type="number"
                  value={formData.deliveryTime}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Order"
                  name="minOrder"
                  type="number"
                  value={formData.minOrder}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isOpen}
                      onChange={(e) => setFormData(prev => ({ ...prev, isOpen: e.target.checked }))}
                      name="isOpen"
                      sx={{
                        '& .MuiSwitch-thumb': {
                          color: '#E65100',
                        },
                        '& .MuiSwitch-track': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    />
                  }
                  label="Restaurant is Open"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions
            sx={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              p: 2,
            }}
          >
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: '#E65100',
                color: 'white',
                '&:hover': {
                  background: '#F57C00',
                  boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
                },
              }}
            >
              {selectedRestaurant ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.9)',
            '& .MuiAlert-icon': {
              color: snackbar.severity === 'error' ? '#f44336' : '#4caf50',
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard; 