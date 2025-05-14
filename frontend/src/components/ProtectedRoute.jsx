import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// This component will protect routes that require authentication.
export default function ProtectedRoute({ children }) {
  const isLoggedIn = !!localStorage.getItem('user'); // Basic check, enhance as needed
  const location = useLocation();

  if (!isLoggedIn) {
    // If not logged in, redirect to the login page.
    // Pass the current location in state, so we can redirect back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in, render the component that was originally requested.
  return children;
} 