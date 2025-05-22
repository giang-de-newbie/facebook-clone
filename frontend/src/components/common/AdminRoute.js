import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('AdminRoute - User from localStorage:', user);
  const isAdmin = user.email === 'admin@gmail.com';
  console.log('AdminRoute - Is admin?', isAdmin);

  if (!isAdmin) {
    console.log('AdminRoute - Redirecting to home...');
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute - Rendering admin content');
  return children;
};

export default AdminRoute; 