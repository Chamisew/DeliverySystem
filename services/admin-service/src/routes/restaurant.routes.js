const express = require('express');
const router = express.Router();
const Restaurant = require('../models/restaurant.model');

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new restaurant
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'description', 'address', 'phone', 'email', 'cuisine', 'deliveryTime', 'minOrder'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Transform and validate data
    const restaurantData = {
      name: String(req.body.name).trim(),
      description: String(req.body.description).trim(),
      address: String(req.body.address).trim(),
      phone: String(req.body.phone).trim(),
      email: String(req.body.email).trim(),
      cuisine: String(req.body.cuisine).trim(),
      deliveryTime: Math.max(1, Number(req.body.deliveryTime)),
      minOrder: Math.max(1, Number(req.body.minOrder)),
      isOpen: Boolean(req.body.isOpen),
      image: req.body.image ? String(req.body.image).trim() : undefined,
      rating: 0,
      reviewCount: 0
    };

    const restaurant = new Restaurant(restaurantData);
    const savedRestaurant = await restaurant.save();
    res.status(201).json(savedRestaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update restaurant
router.put('/:id', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'description', 'address', 'phone', 'email', 'cuisine', 'deliveryTime', 'minOrder'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Transform and validate data
    const restaurantData = {
      name: String(req.body.name).trim(),
      description: String(req.body.description).trim(),
      address: String(req.body.address).trim(),
      phone: String(req.body.phone).trim(),
      email: String(req.body.email).trim(),
      cuisine: String(req.body.cuisine).trim(),
      deliveryTime: Math.max(1, Number(req.body.deliveryTime)),
      minOrder: Math.max(1, Number(req.body.minOrder)),
      isOpen: Boolean(req.body.isOpen),
      image: req.body.image ? String(req.body.image).trim() : undefined
    };

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      restaurantData,
      { new: true, runValidators: true }
    );
    if (!updatedRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete restaurant
router.delete('/:id', async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deletedRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 