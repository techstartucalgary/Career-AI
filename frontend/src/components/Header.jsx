import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { apiFetch, getAuthToken, clearAuthToken } from '../services/api';
import { useBreakpoints } from '../hooks/useBreakpoints';
import styles from './Header.styles';
import verexaLogo from '../assets/verexalogo.png';

const Header = () => {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments.length > 0 ? '/' + segments.join('/') : '/';
  const { isWideLayout } = useBreakpoints();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoggedIn = !!getAuthToken();

  const navItems = [
    { label: 'Job Board', route: '/jobs' },
    { label: 'AI Resume', route: '/resume' },
    { label: 'AI Cover Letter', route: '/cover-letter' },
    { label: 'Interview Prep', route: '/interview-buddy' },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [currentRoute]);

  const handleLogout = async () => {
    try {
      await apiFetch('/logout');
    } catch {
      // Ignore logout failures and clear local auth state
    }
    clearAuthToken();
    setMenuOpen(false);
    router.replace('/authentication');
  };

  const handleLogin = () => {
    router.push('/authentication');
  };

  const goNav = (route) => {
    setMenuOpen(false);
    router.push(route);
  };

  const showMobileMenu = isLoggedIn && !isWideLayout;

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

          {isLoggedIn && isWideLayout ? (
            <View style={styles.navLinksWrap}>
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
            </View>
          ) : (
            <View style={styles.navSpacer} />
          )}

          <View style={styles.navRight}>
            {isLoggedIn && isWideLayout && (
              <View style={styles.buttonGroup}>
                <Pressable onPress={() => router.push('/pricing')} style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>✦ Upgrade</Text>
                </Pressable>
                <Pressable style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                  <View style={styles.arrowIcon}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </Pressable>
              </View>
            )}
            {showMobileMenu && (
              <Pressable
                onPress={() => setMenuOpen((o) => !o)}
                style={styles.menuIconButton}
                accessibilityRole="button"
                accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
              >
                <Text style={styles.menuIcon}>{menuOpen ? '✕' : '☰'}</Text>
              </Pressable>
            )}
            {!isLoggedIn && (
              <Pressable style={styles.logoutButton} onPress={handleLogin}>
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

      {showMobileMenu && menuOpen && (
        <View style={styles.mobileMenu}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.route || currentRoute.startsWith(item.route + '/');
            return (
              <Pressable
                key={item.route}
                onPress={() => goNav(item.route)}
                style={styles.mobileMenuItem}
              >
                <Text style={[styles.mobileMenuText, isActive && styles.mobileMenuTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.mobileMenuDivider} />
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push('/pricing');
            }}
            style={styles.mobileMenuItem}
          >
            <Text style={styles.mobileMenuText}>✦ Upgrade</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.mobileMenuItem}>
            <Text style={styles.mobileMenuText}>Log Out</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default Header;
