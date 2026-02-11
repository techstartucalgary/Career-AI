import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Show loading state while checking auth
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#0f0f1a'
      }}>
        <div style={{ color: '#fff' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to authentication page if not authenticated
    return <Navigate to="/authentication" replace />;
  }

  return children;
};

export default ProtectedRoute;
