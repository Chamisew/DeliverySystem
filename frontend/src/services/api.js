import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ORDER_API_URL = process.env.REACT_APP_ORDER_API_URL || 'http://localhost:3003';
const RESTAURANT_API_URL = process.env.REACT_APP_RESTAURANT_API_URL || 'http://localhost:3002';
const AUTH_API_URL = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:3001';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Create specific API instances for different services
export const authApi = axios.create({
  baseURL: `${AUTH_API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const restaurantApi = axios.create({
  baseURL: `${RESTAURANT_API_URL}/restaurants`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const orderApi = axios.create({
  baseURL: `${ORDER_API_URL}/orders`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all API instances
[authApi, restaurantApi, orderApi].forEach((instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
});

export default api; 