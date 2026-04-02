import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Image, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { apiFetch, getAuthToken, clearAuthToken } from '../services/api';
import { useBreakpoints } from '../hooks/useBreakpoints';
import styles from './Header.styles';
import verexaLogo from '../assets/verexalogo.png';
import ForwardArrowIcon from './ForwardArrowIcon';

const Header = () => {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments.length > 0 ? '/' + segments.join('/') : '/';
  const { isWideLayout } = useBreakpoints();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const isLoggedIn = !!getAuthToken();

  const navItems = [
    { label: 'Job Board', route: '/jobs' },
    { label: 'AI Resume', route: '/resume' },
    { label: 'AI Cover Letter', route: '/cover-letter' },
    { label: 'Interview Prep', route: '/interview-buddy' },
  ];

  useEffect(() => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }, [currentRoute]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !accountMenuOpen) return undefined;
    const onMouseDown = (e) => {
      const el = accountMenuRef.current;
      if (el && typeof el.contains === 'function' && !el.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    try {
      await apiFetch('/logout');
    } catch {
      // Ignore logout failures and clear local auth state
    }
    clearAuthToken();
    setMenuOpen(false);
    setAccountMenuOpen(false);
    router.replace('/authentication');
  };

  const handleLogin = () => {
    router.push('/authentication');
  };

  const goNav = (route) => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
    router.push(route);
  };

  const showMobileMenu = isLoggedIn && !isWideLayout;

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <View style={styles.navLeft}>
            <Pressable onPress={() => router.push(isLoggedIn ? '/jobs' : '/authentication')} style={styles.logoContainer}>
              <Image
                source={verexaLogo}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Pressable>
          </View>

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
              <View ref={accountMenuRef} style={styles.accountMenuWrap} collapsable={false}>
                <Pressable
                  onPress={() => setAccountMenuOpen((o) => !o)}
                  style={[
                    styles.menuIconButton,
                    accountMenuOpen && styles.accountMenuTriggerActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={accountMenuOpen ? 'Close account menu' : 'Open account menu'}
                  accessibilityState={{ expanded: accountMenuOpen }}
                >
                  <Text style={styles.menuIcon}>{accountMenuOpen ? '✕' : '☰'}</Text>
                </Pressable>
                {accountMenuOpen && (
                  <View style={styles.accountDropdown}>
                    <Pressable
                      style={styles.accountDropdownItem}
                      onPress={() => goNav('/profile')}
                    >
                      <Text style={styles.accountDropdownItemText}>Profile</Text>
                    </Pressable>
                    <Pressable
                      style={styles.accountDropdownItem}
                      onPress={() => goNav('/pricing')}
                    >
                      <Text style={styles.accountDropdownItemText}>Upgrade</Text>
                    </Pressable>
                    <View style={styles.accountDropdownDivider} />
                    <Pressable style={styles.accountDropdownItem} onPress={handleLogout}>
                      <Text style={styles.accountDropdownItemText}>Log out</Text>
                    </Pressable>
                  </View>
                )}
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
                <ForwardArrowIcon />
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
          <Pressable onPress={() => goNav('/profile')} style={styles.mobileMenuItem}>
            <Text style={styles.mobileMenuText}>Profile</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push('/pricing');
            }}
            style={styles.mobileMenuItem}
          >
            <Text style={styles.mobileMenuText}>Upgrade</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.mobileMenuItem}>
            <Text style={styles.mobileMenuText}>Log out</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default Header;
