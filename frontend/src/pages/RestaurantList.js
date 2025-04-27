import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  useTheme,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';

const RestaurantList = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const theme = useTheme();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${process.env.REACT_APP_RESTAURANT_API_URL}/restaurants`);
      setRestaurants(response.data.restaurants || []);
    } catch (error) {
      setError(`Failed to fetch restaurants: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants
    .filter((restaurant) => {
      const matchesSearch = restaurant.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCuisine = !cuisineFilter || restaurant.cuisine === cuisineFilter;
      const matchesRating = !ratingFilter || restaurant.rating >= parseInt(ratingFilter);
      return matchesSearch && matchesCuisine && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'deliveryTime':
          return a.deliveryTime - b.deliveryTime;
        case 'price':
          return a.minOrder - b.minOrder;
        default:
          return 0;
      }
    });

  const cuisines = [...new Set(restaurants.map((r) => r.cuisine))];

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
          Restaurants
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2,
          }}
        >
          Discover and order from your favorite restaurants
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

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'rgba(255, 255, 255, 0.9)',
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
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#E65100',
                  },
                }}
              >
                Cuisine
              </InputLabel>
              <Select
                value={cuisineFilter}
                label="Cuisine"
                onChange={(e) => setCuisineFilter(e.target.value)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E65100',
                    boxShadow: '0 0 0 2px rgba(230, 81, 0, 0.2)',
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: 'rgba(30, 30, 30, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      '& .MuiMenuItem-root': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'rgba(230, 81, 0, 0.1)',
                          color: '#E65100',
                        },
                        '&.Mui-selected': {
                          background: 'rgba(230, 81, 0, 0.2)',
                          color: '#E65100',
                          '&:hover': {
                            background: 'rgba(230, 81, 0, 0.3)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">All Cuisines</MenuItem>
                {cuisines.map((cuisine) => (
                  <MenuItem key={cuisine} value={cuisine}>
                    {cuisine}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#E65100',
                  },
                }}
              >
                Minimum Rating
              </InputLabel>
              <Select
                value={ratingFilter}
                label="Minimum Rating"
                onChange={(e) => setRatingFilter(e.target.value)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E65100',
                    boxShadow: '0 0 0 2px rgba(230, 81, 0, 0.2)',
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: 'rgba(30, 30, 30, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      '& .MuiMenuItem-root': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'rgba(230, 81, 0, 0.1)',
                          color: '#E65100',
                        },
                        '&.Mui-selected': {
                          background: 'rgba(230, 81, 0, 0.2)',
                          color: '#E65100',
                          '&:hover': {
                            background: 'rgba(230, 81, 0, 0.3)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">All Ratings</MenuItem>
                <MenuItem value="4">4+ Stars</MenuItem>
                <MenuItem value="3">3+ Stars</MenuItem>
                <MenuItem value="2">2+ Stars</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#E65100',
                  },
                }}
              >
                Sort By
              </InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E65100',
                    boxShadow: '0 0 0 2px rgba(230, 81, 0, 0.2)',
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: 'rgba(30, 30, 30, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      '& .MuiMenuItem-root': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'rgba(230, 81, 0, 0.1)',
                          color: '#E65100',
                        },
                        '&.Mui-selected': {
                          background: 'rgba(230, 81, 0, 0.2)',
                          color: '#E65100',
                          '&:hover': {
                            background: 'rgba(230, 81, 0, 0.3)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="rating">Rating</MenuItem>
                <MenuItem value="deliveryTime">Delivery Time</MenuItem>
                <MenuItem value="price">Price</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Restaurant Grid */}
      <Grid container spacing={3}>
        {filteredRestaurants.map((restaurant) => (
          <Grid item xs={12} sm={6} md={4} key={restaurant._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'rgba(30, 30, 30, 0.8)',
                backdropFilter: 'blur(10px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: 3,
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.01)',
                  boxShadow: `0 12px 28px rgba(230, 81, 0, 0.2)`,
                  background: 'rgba(40, 40, 40, 0.9)',
                },
              }}
              onClick={() => navigate(`/restaurants/${restaurant._id}`)}
            >
              <CardMedia
                component="img"
                height="200"
                image={restaurant.image || 'https://via.placeholder.com/400x200'}
                alt={restaurant.name}
                sx={{
                  objectFit: 'cover',
                  filter: 'brightness(0.9)',
                }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 700,
                  }}
                >
                  {restaurant.name}
                </Typography>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {restaurant.cuisine}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating 
                    value={restaurant.rating} 
                    readOnly 
                    size="small"
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: '#E65100',
                      },
                      '& .MuiRating-iconEmpty': {
                        color: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      ml: 1,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    ({restaurant.reviewCount})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    label={`${restaurant.deliveryTime} min`}
                    size="small"
                    sx={{
                      background: 'rgba(230, 81, 0, 0.2)',
                      color: '#E65100',
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={restaurant.isOpen ? 'Open' : 'Closed'}
                    size="small"
                    sx={{
                      background: restaurant.isOpen 
                        ? 'rgba(76, 175, 80, 0.2)' 
                        : 'rgba(244, 67, 54, 0.2)',
                      color: restaurant.isOpen 
                        ? '#4CAF50' 
                        : '#F44336',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography 
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Min. Order: Rs. {restaurant.minOrder}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredRestaurants.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography 
            variant="h6" 
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            No restaurants found matching your criteria
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default RestaurantList; 