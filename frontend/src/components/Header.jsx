import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Image, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { apiUrl, clearAuthToken, getAuthToken, getUserProfile } from '../services/api';
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
  const [accountAvatarUri, setAccountAvatarUri] = useState(null);
  const [accountInitials, setAccountInitials] = useState('U');
  const accountMenuRef = useRef(null);

  const isLoggedIn = !!getAuthToken();

  const navItems = [
    { label: 'Job Board', route: '/jobs' },
    { label: 'Auto Apply', route: '/auto-apply' },
    { label: 'AI Resume', route: '/resume' },
    { label: 'AI Cover Letter', route: '/cover-letter' },
    { label: 'Interview Prep', route: '/interview-buddy' },
  ];

  useEffect(() => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }, [currentRoute]);

  const loadAccountAvatar = useCallback(async (forceRefresh = false) => {
    if (!isLoggedIn) {
      setAccountAvatarUri(null);
      setAccountInitials('U');
      return;
    }

    try {
      const response = await getUserProfile({ forceRefresh });
      const data = response && response.data ? response.data : (response || {});
      const profile = (data && data.profile) ? data.profile : {};
      const isBcrypt = (value) => typeof value === 'string' && value.startsWith('$2');
      const first = profile.first_name || (isBcrypt(data.first_name) ? '' : data.first_name) || '';
      const last = profile.last_name || (isBcrypt(data.last_name) ? '' : data.last_name) || '';
      const fullName = `${first} ${last}`.trim();
      const combinedName = data.name || fullName;
      const initials = combinedName.trim()
        ? combinedName
            .trim()
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : 'U';
      const uri =
        profile.avatar_opt_out
          ? null
          : profile.avatar_base64 && profile.avatar_mime
          ? `data:${profile.avatar_mime};base64,${profile.avatar_base64}`
          : profile.avatar_url || profile.picture || data.avatar_url || data.picture || null;

      setAccountAvatarUri(uri);
      setAccountInitials(initials);
    } catch {
      setAccountAvatarUri(null);
      setAccountInitials('U');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void loadAccountAvatar(false);
  }, [loadAccountAvatar]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleProfileUpdated = () => {
      void loadAccountAvatar(true);
    };

    window.addEventListener('career-ai-profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('career-ai-profile-updated', handleProfileUpdated);
    };
  }, [loadAccountAvatar]);

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

  const handleLogout = () => {
    clearAuthToken();
    setMenuOpen(false);
    setAccountMenuOpen(false);
    router.replace('/authentication');

    // Fire-and-forget server logout so the UI never waits on the network.
    void fetch(apiUrl('/logout'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(() => {
      // Ignore logout failures; local auth has already been cleared.
    });
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
  const showCenterLinks = isLoggedIn && isWideLayout;

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <View style={styles.navLeftZone}>
            <Pressable onPress={() => router.push(isLoggedIn ? '/jobs' : '/authentication')} style={styles.logoContainer}>
              <Image
                source={verexaLogo}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Pressable>
          </View>

          <View style={[styles.navCenterZone, !showCenterLinks && styles.navCenterZoneFlex]}>
            {showCenterLinks ? (
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
            ) : null}
          </View>

          <View style={styles.navRight}>
            {isLoggedIn && isWideLayout && (
              <View ref={accountMenuRef} style={styles.accountMenuWrap} collapsable={false}>
                <Pressable
                  onPress={() => setAccountMenuOpen((o) => !o)}
                  style={[
                    styles.accountMenuButton,
                    accountMenuOpen && styles.accountMenuTriggerActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={accountMenuOpen ? 'Close account menu' : 'Open account menu'}
                  accessibilityState={{ expanded: accountMenuOpen }}
                >
                  {accountAvatarUri ? (
                    <Image
                      source={{ uri: accountAvatarUri }}
                      style={styles.accountAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.accountAvatarInitials}>{accountInitials}</Text>
                  )}
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
