import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing auth with token:', token);
      if (token) {
        try {
          console.log('Attempting to verify token with auth service');
          const response = await authApi.get('/auth/me');
          console.log('Auth service response:', response.data);
          setUser(response.data);
        } catch (error) {
          console.error('Auth initialization error:', error);
          if (error.response?.status === 401) {
            console.log('Token is invalid or expired, clearing auth state');
            // Token is invalid or expired
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        console.log('No token found during initialization');
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = (newToken, userData) => {
    console.log('Login called with token:', newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    console.log('Logout called');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    console.log('Updating user data:', userData);
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const value = {
    user,
    setUser: updateUser,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isRestaurant: user?.role === 'restaurant',
    isDelivery: user?.role === 'delivery',
    isCustomer: user?.role === 'customer',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 