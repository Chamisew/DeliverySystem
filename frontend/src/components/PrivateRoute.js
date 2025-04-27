import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no specific roles are required, allow access
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(user.role)) {
    // Show unauthorized message with option to go to appropriate dashboard
    let dashboardPath = '/';
    switch (user.role) {
      case 'admin':
        dashboardPath = '/admin/dashboard';
        break;
      case 'restaurant':
        dashboardPath = '/restaurant/dashboard';
        break;
      case 'delivery':
        dashboardPath = '/delivery/dashboard';
        break;
      case 'customer':
        dashboardPath = '/';
        break;
      default:
        dashboardPath = '/';
    }

    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Unauthorized Access
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You don't have permission to access this page.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Your role: {user.role}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Required roles: {allowedRoles.join(', ')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
          onClick={() => window.location.href = dashboardPath}
        >
          Go to {user.role} Dashboard
        </Button>
      </Box>
    );
  }

  return children;
};

export default PrivateRoute; 