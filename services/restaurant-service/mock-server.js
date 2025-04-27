require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockRestaurant = {
  _id: 'mock-restaurant-id',
  name: 'Mock Restaurant',
  description: 'This is a mock restaurant for testing',
  cuisine: 'General',
  address: '123 Mock St',
  owner: '67fe290566a8e02a6dd0cb19',
  isOpen: true,
  isVerified: true,
  rating: 4.5,
  reviewCount: 10,
  deliveryTime: 30,
  minOrder: 10,
  deliveryFee: 5,
  openingHours: {
    monday: { open: '09:00', close: '22:00' },
    tuesday: { open: '09:00', close: '22:00' },
    wednesday: { open: '09:00', close: '22:00' },
    thursday: { open: '09:00', close: '22:00' },
    friday: { open: '09:00', close: '23:00' },
    saturday: { open: '10:00', close: '23:00' },
    sunday: { open: '10:00', close: '22:00' },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockStats = {
  totalOrders: 50,
  totalRevenue: 1250.75,
  activeOrders: 3,
  menuItems: 15,
};

const mockMenuItems = [
  {
    _id: 'mock-menu-item-1',
    name: 'Mock Burger',
    description: 'A delicious mock burger',
    price: 9.99,
    category: 'Burgers',
    restaurant: 'mock-restaurant-id',
    isAvailable: true,
    preparationTime: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock-menu-item-2',
    name: 'Mock Pizza',
    description: 'A tasty mock pizza',
    price: 12.99,
    category: 'Pizza',
    restaurant: 'mock-restaurant-id',
    isAvailable: true,
    preparationTime: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Auth middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = { _id: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Routes
app.get('/api/restaurants/me', auth, (req, res) => {
  console.log('Getting restaurant for user:', req.user._id);
  res.json(mockRestaurant);
});

app.get('/api/restaurants/stats', auth, (req, res) => {
  console.log('=== Getting Restaurant Stats ===');
  console.log('User:', { id: req.user._id, role: req.user.role });
  res.json(mockStats);
});

app.get('/api/restaurants/:restaurantId/menu', auth, (req, res) => {
  console.log('Getting menu for restaurant:', req.params.restaurantId);
  res.json(mockMenuItems);
});

app.post('/api/restaurants/:restaurantId/menu', auth, (req, res) => {
  console.log('Creating menu item for restaurant:', req.params.restaurantId);
  console.log('Menu item data:', req.body);
  
  const newMenuItem = {
    _id: 'mock-menu-item-' + Math.random().toString(36).substring(2, 7),
    ...req.body,
    restaurant: req.params.restaurantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  mockMenuItems.push(newMenuItem);
  
  res.status(201).json(newMenuItem);
});

app.put('/api/restaurants/:restaurantId/menu/:itemId', auth, (req, res) => {
  console.log('Updating menu item:', req.params.itemId);
  console.log('Update data:', req.body);
  
  const itemIndex = mockMenuItems.findIndex(item => item._id === req.params.itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Menu item not found' });
  }
  
  mockMenuItems[itemIndex] = {
    ...mockMenuItems[itemIndex],
    ...req.body,
    updatedAt: new Date(),
  };
  
  res.json(mockMenuItems[itemIndex]);
});

app.delete('/api/restaurants/:restaurantId/menu/:itemId', auth, (req, res) => {
  console.log('Deleting menu item:', req.params.itemId);
  
  const itemIndex = mockMenuItems.findIndex(item => item._id === req.params.itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Menu item not found' });
  }
  
  mockMenuItems.splice(itemIndex, 1);
  
  res.json({ message: 'Menu item deleted successfully' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'restaurant-service-mock' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Mock restaurant service running on port ${PORT}`);
}); 