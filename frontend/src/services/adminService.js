import axios from 'axios';

const API_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:3006/api/admin';

const adminService = {
  // Get all restaurants
  getAllRestaurants: async () => {
    try {
      const response = await axios.get(`${API_URL}/restaurants`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get restaurant by ID
  getRestaurantById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/restaurants/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new restaurant
  createRestaurant: async (restaurantData) => {
    try {
      // Convert cuisine to string if it's an array
      const formattedData = {
        ...restaurantData,
        cuisine: typeof restaurantData.cuisine === 'string' ? restaurantData.cuisine : restaurantData.cuisine[0],
        deliveryTime: Number(restaurantData.deliveryTime),
        minOrder: Number(restaurantData.minOrder),
        isOpen: Boolean(restaurantData.isOpen)
      };

      console.log('Sending formatted data to server:', formattedData);
      const response = await axios.post(`${API_URL}/restaurants`, formattedData);
      return response.data;
    } catch (error) {
      console.error('Error in createRestaurant:', error.response?.data || error);
      throw error.response?.data || error.message;
    }
  },

  // Update restaurant
  updateRestaurant: async (id, restaurantData) => {
    try {
      // Convert cuisine to string if it's an array
      const formattedData = {
        ...restaurantData,
        cuisine: typeof restaurantData.cuisine === 'string' ? restaurantData.cuisine : restaurantData.cuisine[0],
        deliveryTime: Number(restaurantData.deliveryTime),
        minOrder: Number(restaurantData.minOrder),
        isOpen: Boolean(restaurantData.isOpen)
      };

      console.log('Sending formatted update data to server:', formattedData);
      const response = await axios.put(`${API_URL}/restaurants/${id}`, formattedData);
      return response.data;
    } catch (error) {
      console.error('Error in updateRestaurant:', error.response?.data || error);
      throw error.response?.data || error.message;
    }
  },

  // Delete restaurant
  deleteRestaurant: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/restaurants/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default adminService; 