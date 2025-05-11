// PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // Check both localStorage and sessionStorage for the token
  const isAuthenticated = sessionStorage.getItem('token') || localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/admin-login" />;
};

export default PrivateRoute;
