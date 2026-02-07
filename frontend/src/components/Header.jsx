import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useMessages } from '../contexts/MessagesContext';
import { apiFetch, clearAuthToken } from '../services/api';
import styles from './Header.styles';

const Header = () => {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments.length > 0 ? '/' + segments.join('/') : '/';
  const { openMessages } = useMessages();

  const navItems = [
    { label: 'Job Board', route: '/jobs'},
    { label: 'AI Resume', route: '/resume'},
    { label: 'AI Cover Letter', route: '/cover-letter'},
    { label: 'Interview Prep', route: '/interview-buddy'},
  ];

  const handleLogout = async () => {
    try {
      await apiFetch('/logout');
    } catch (error) {
      // Ignore logout failures and clear local auth state
    }
    clearAuthToken();
    router.replace('/authentication');
  };

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.push('/home')} style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <View style={styles.logoStar} />
            </View>
            <Text style={styles.logoText}>Verexa</Text>
          </Pressable>
          
          <View style={styles.navLinks}>
            {navItems.map((item) => {
              const isActive = currentRoute === item.route || currentRoute.startsWith(item.route + '/');
              return (
                <Pressable 
                  key={item.route}
                  onPress={() => router.push(item.route)}
                  style={styles.navLinkContainer}
                >
                  <Text style={[styles.navLink, isActive && styles.navLinkActive]}>
                    {item.label}
                  </Text>
            </Pressable>
              );
            })}
          </View>
          
          <View style={styles.buttonGroup}>
            <Pressable onPress={openMessages} style={styles.messagesButton}>
              <Text style={styles.messagesButtonText}>Messages</Text>
            </Pressable>
            <Pressable 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Log Out</Text>
              <View style={styles.arrowIcon}>
                <View style={styles.arrowLine} />
                <View style={styles.arrowHead} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Header;
