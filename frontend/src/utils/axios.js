import axios from 'axios';

// Create axios instances for each service
const createInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add a request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      console.log('Current token in localStorage:', token);
      
      if (token) {
        // Ensure token is properly formatted
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        config.headers.Authorization = formattedToken;
        console.log('Adding token to request headers:', formattedToken);
      } else {
        console.log('No token found in localStorage');
      }
      
      // Add detailed debugging
      console.log('Request details:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data
      });
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Add a response interceptor
  instance.interceptors.response.use(
    (response) => {
      // Log successful responses
      console.log('Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
      return response;
    },
    (error) => {
      // Log detailed error information
      console.error('Response error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        headers: error.config?.headers
      });

      if (error.response?.status === 401) {
        console.log('401 Unauthorized error. Current path:', window.location.pathname);
        // Only redirect to login if we're not already on the login page
        // and if the error is not from the login endpoint itself
        if (window.location.pathname !== '/login' && 
            !error.config.url.includes('/auth/login')) {
          console.log('Redirecting to login page');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create instances for each service
const authApi = createInstance(process.env.REACT_APP_API_URL);
const restaurantApi = createInstance(process.env.REACT_APP_RESTAURANT_API_URL);
const orderApi = createInstance(process.env.REACT_APP_ORDER_API_URL);
const deliveryApi = createInstance(process.env.REACT_APP_DELIVERY_API_URL);
const paymentApi = createInstance(process.env.REACT_APP_PAYMENT_API_URL);

// Export all instances
export {
  authApi,
  restaurantApi,
  orderApi,
  deliveryApi,
  paymentApi
};

// Default export for backward compatibility
export default authApi; 