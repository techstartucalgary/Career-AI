import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { getAuthToken } from '../services/api';

/**
 * HOC to protect routes that require authentication
 * Wraps a component and redirects to landing page if not authenticated
 */
export default function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const token = getAuthToken();
      setIsAuthenticated(!!token);
      setIsChecking(false);
    }, []);

    if (isChecking) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#0f0f1a' 
        }}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Loading...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return <Redirect href="/authentication" />;
    }

    return <WrappedComponent {...props} />;
  };
}
