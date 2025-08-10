import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../src/api.js';

export default function RequireAuth({ children }) {
  const token = getToken();
  const location = useLocation();
  if (!token) {
    // redirige a /login y recuerda a dónde iba
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
