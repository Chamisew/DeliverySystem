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
  TextField,
  Button,
  Avatar,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { authApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authApi.put(
        `/users/${user._id}`,
        {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        }
      );
      
      setUser({
        name: response.data.name,
        phone: response.data.phone,
        address: response.data.address
      });
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authApi.put(
        `/users/${user._id}/password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }
      );
      
      setSuccess('Password updated successfully');
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
          Profile
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
          Manage your account information
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

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              height: '100%',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: '#E65100',
                    fontSize: '3rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
                  }}
                >
                  {formData.name.charAt(0).toUpperCase()}
                </Avatar>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  mt: 2,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                {formData.name}
              </Typography>
              <Chip
                label={user.role}
                sx={{
                  mt: 1,
                  bgcolor: 'rgba(230, 81, 0, 0.1)',
                  color: '#E65100',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card
            sx={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  color: '#E65100',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  mb: 3,
                }}
              >
                Personal Information
              </Typography>

              <form onSubmit={handleUpdateProfile}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ color: '#E65100', mr: 1 }} />,
                      }}
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
                      value={formData.email}
                      disabled
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ color: '#E65100', mr: 1 }} />,
                      }}
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
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ color: '#E65100', mr: 1 }} />,
                      }}
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
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      multiline
                      rows={3}
                      InputProps={{
                        startAdornment: <LocationIcon sx={{ color: '#E65100', mr: 1 }} />,
                      }}
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
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={loading}
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
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              <Typography
                variant="h6"
                sx={{
                  color: '#E65100',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  mb: 3,
                }}
              >
                Change Password
              </Typography>

              <form onSubmit={handleChangePassword}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
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
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
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
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
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
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
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
                      {loading ? 'Updating...' : 'Change Password'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 