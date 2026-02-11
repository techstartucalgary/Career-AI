import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useMessages } from '../contexts/MessagesContext';
import { apiFetch, getAuthToken, clearAuthToken } from '../services/api';
import styles from './Header.styles';
import verexaLogo from '../assets/verexalogo.png';

const Header = () => {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments.length > 0 ? '/' + segments.join('/') : '/';
  const { openMessages } = useMessages();

  const isLoggedIn = !!getAuthToken();

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

  const handleLogin = () => {
    router.push('/authentication');
  };

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.push(isLoggedIn ? '/jobs' : '/authentication')} style={styles.logoContainer}>
            <Image 
              source={verexaLogo} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Pressable>
          
          {isLoggedIn && (
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
          )}
          
          <View style={styles.buttonGroup}>
            {isLoggedIn && (
              <Pressable onPress={openMessages} style={styles.messagesButton}>
                <Text style={styles.messagesButtonText}>Messages</Text>
              </Pressable>
            )}
            {isLoggedIn ? (
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
            ) : (
              <Pressable 
                style={styles.logoutButton}
                onPress={handleLogin}
              >
                <Text style={styles.logoutButtonText}>Log In</Text>
                <View style={styles.arrowIcon}>
                  <View style={styles.arrowLine} />
                  <View style={styles.arrowHead} />
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default Header;
