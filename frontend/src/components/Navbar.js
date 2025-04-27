import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Container,
  useTheme,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Restaurant as RestaurantIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'restaurant':
        return '/restaurant/dashboard';
      case 'delivery':
        return '/delivery/dashboard';
      default:
        return '/';
    }
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'linear-gradient(to right, #1A1A1A, #333333)',
        borderBottom: `2px solid ${theme.palette.primary.main}`,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
              '&:hover': {
                transform: 'scale(1.02)',
                transition: 'transform 0.2s ease-in-out',
              },
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mr: 2,
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              FoodExpress
            </Typography>
            <Box
              component="img"
              src="https://deepfoodaddict.storage.googleapis.com/2022/09/25123417/hunger.png"
              alt="Food Delivery"
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                border: `2px solid ${theme.palette.primary.main}`,
                boxShadow: `0 0 10px ${theme.palette.primary.main}`,
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <>
                <Button
                  component={RouterLink}
                  to={getDashboardLink()}
                  startIcon={<DashboardIcon />}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    },
                  }}
                >
                  Dashboard
                </Button>
                {user.role === 'customer' && (
                  <>
                    <Button
                      component={RouterLink}
                      to="/cart"
                      startIcon={<CartIcon />}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 0, 0.1)',
                        },
                      }}
                    >
                      Cart
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/orders"
                      startIcon={<RestaurantIcon />}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 0, 0.1)',
                        },
                      }}
                    >
                      Orders
                    </Button>
                  </>
                )}
                <Button
                  component={RouterLink}
                  to="/profile"
                  startIcon={<PersonIcon />}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    },
                  }}
                >
                  Profile
                </Button>
                <IconButton 
                  onClick={handleLogout}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    },
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </>
            )}
            {!user && (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 