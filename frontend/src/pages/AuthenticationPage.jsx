import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Header from '../components/Header';
import styles from './AuthenticationPage.styles';
import { THEME } from '../styles/theme';
import { API_BASE_URL, getUserProfile, setAuthToken } from '../services/api';
import verexaLogo from '../assets/verexalogo.png';
import { useBreakpoints } from '../hooks/useBreakpoints';

const GOOGLE_GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const ONBOARDING_PENDING_KEY = 'career_ai_onboarding_pending';
const ONBOARDING_EMAIL_KEY = 'career_ai_onboarding_email';

export default function AuthenticationPage() {
  const router = useRouter();
  const { isWideLayout } = useBreakpoints();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredSwitch, setHoveredSwitch] = useState(false);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(Platform.OS !== 'web');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleOriginAllowed, setGoogleOriginAllowed] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleInitialized = useRef(false);
  const googleInitializedForClientId = useRef('');
  const oneTapPromptedForClientId = useRef('');
  const googleButtonHostRef = useRef(null);
  const hasGoogleClientId = googleClientId.trim().length > 0;
  const canUseGoogleGsi = hasGoogleClientId && googleOriginAllowed;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    const upsertMeta = (httpEquiv, content) => {
      let meta = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
      const previous = meta ? meta.getAttribute('content') : null;

      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('http-equiv', httpEquiv);
        document.head.appendChild(meta);
      }

      meta.setAttribute('content', content);

      return () => {
        if (!meta) return;
        if (previous === null) {
          meta.remove();
        } else {
          meta.setAttribute('content', previous);
        }
      };
    };

    const restoreCoop = upsertMeta('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    const restoreCoep = upsertMeta('Cross-Origin-Embedder-Policy', 'unsafe-none');

    return () => {
      restoreCoop();
      restoreCoep();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchGoogleClientId = async () => {
      try {
        const currentOrigin =
          Platform.OS === 'web' && typeof window !== 'undefined' && window.location
            ? window.location.origin
            : '';
        const query = currentOrigin ? `?origin=${encodeURIComponent(currentOrigin)}` : '';
        const response = await fetch(`${API_BASE_URL}/auth/google/client-id${query}`);
        if (!response.ok) {
          if (!cancelled) {
            setGoogleOriginAllowed(false);
          }
          return;
        }

        const payload = await response.json();
        const clientId = payload && payload.data && typeof payload.data.client_id === 'string'
          ? payload.data.client_id
          : '';
        const originAllowed = Boolean(payload && payload.data && payload.data.origin_allowed);

        if (!cancelled) {
          setGoogleClientId(clientId);
          setGoogleOriginAllowed(originAllowed);
        }
      } catch {
        if (!cancelled) {
          setGoogleClientId('');
          setGoogleOriginAllowed(false);
        }
      }
    };

    fetchGoogleClientId();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    let isCancelled = false;

    const onScriptReady = () => {
      if (!isCancelled) {
        setIsGoogleScriptLoaded(true);
      }
    };

    const existingScript = document.querySelector('script[data-google-gsi="true"]');
    if (existingScript) {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        onScriptReady();
      } else {
        existingScript.addEventListener('load', onScriptReady, { once: true });
      }

      return () => {
        isCancelled = true;
        existingScript.removeEventListener('load', onScriptReady);
      };
    }

    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.addEventListener('load', onScriptReady, { once: true });
    document.head.appendChild(script);

    return () => {
      isCancelled = true;
      script.removeEventListener('load', onScriptReady);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isGoogleScriptLoaded || typeof window === 'undefined' || !canUseGoogleGsi) {
      return;
    }

    const googleAccounts = window.google && window.google.accounts && window.google.accounts.id;
    if (!googleAccounts) {
      return;
    }

    const handleGoogleCredentialResponse = async (response) => {
      if (!response || !response.credential) {
        return;
      }

      setGoogleLoading(true);
      setErrors({});

      try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: response.credential }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.data && data.data.token) {
            setAuthToken(data.data.token);
            void getUserProfile({ forceRefresh: true }).catch(() => {});

            const isNewGoogleAccount = Boolean(data.data.is_new_user) || data.data.profile_completed === false;
            if (isSignUp || isNewGoogleAccount) {
              if (typeof window !== 'undefined' && window.sessionStorage) {
                window.sessionStorage.setItem(ONBOARDING_PENDING_KEY, '1');
                window.sessionStorage.setItem(ONBOARDING_EMAIL_KEY, data.data.email || email);
              }
              router.replace('/onboarding');
            } else {
              router.replace('/jobs');
            }
          }
        }
      } catch {
        setErrors({ general: 'Google sign-in is not fully configured yet.' });
      } finally {
        setGoogleLoading(false);
      }
    };

    const googleWindow = window;
    const alreadyInitializedForThisClient =
      googleInitialized.current &&
      googleInitializedForClientId.current === googleClientId &&
      googleWindow.__careerAiGoogleClientId === googleClientId;

    if (!alreadyInitializedForThisClient) {
      googleAccounts.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        use_fedcm_for_prompt: false,
      });
      googleInitialized.current = true;
      googleInitializedForClientId.current = googleClientId;
      googleWindow.__careerAiGoogleClientId = googleClientId;
    } else {
      googleWindow.__careerAiGoogleClientId = googleClientId;
    }

    const buttonHost = googleButtonHostRef.current;
    if (!buttonHost) {
      setIsGoogleReady(true);
      return;
    }

    buttonHost.innerHTML = '';

    try {
      googleAccounts.renderButton(buttonHost, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.max(280, Math.min(400, (window.innerWidth || 400) - 48)),
        ux_mode: 'popup',
      });
    } catch {
      buttonHost.innerHTML = '';
    }

    if (oneTapPromptedForClientId.current !== googleClientId) {
      oneTapPromptedForClientId.current = googleClientId;
      try {
        googleAccounts.prompt();
      } catch {
        oneTapPromptedForClientId.current = '';
      }
    }

    setIsGoogleReady(true);
  }, [canUseGoogleGsi, googleClientId, isGoogleScriptLoaded, router, isSignUp, email]);

  const handleGoogleContinue = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setErrors({ general: 'Google sign-in is available on web.' });
      return;
    }

    const googleAccounts = window.google && window.google.accounts && window.google.accounts.id;
    if (!googleAccounts || !isGoogleReady || !canUseGoogleGsi) {
      setErrors({ general: 'Google sign-in is not ready yet. Please try again.' });
      return;
    }

    try {
      googleAccounts.prompt();

      const buttonHost = googleButtonHostRef.current;
      const renderedButton = buttonHost
        ? buttonHost.querySelector('button, div[role="button"], iframe')
        : null;

      if (renderedButton && typeof renderedButton.click === 'function') {
        renderedButton.click();
      }
    } catch {
      setErrors({ general: 'Unable to open Google sign-in prompt.' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    if (isSignUp) {
      if (!name) newErrors.name = 'Name is required';
      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const url = isSignUp
        ? `${API_BASE_URL}/signup`
        : `${API_BASE_URL}/login`;

      const payload = isSignUp
        ? { email, password, name }
        : { email, password };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save the authentication token
      if (data.data && data.data.token) {
        setAuthToken(data.data.token);
        void getUserProfile({ forceRefresh: true }).catch(() => {});
      }

      setLoading(false);

      // Navigate to onboarding for new sign-ups, home for existing users
      if (isSignUp) {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(ONBOARDING_PENDING_KEY, '1');
          window.sessionStorage.setItem(ONBOARDING_EMAIL_KEY, email);
        }
        router.replace('/onboarding');
      } else {
        router.replace('/jobs');
      }
    } catch (error) {
      setLoading(false);
      setErrors({ general: error.message || 'Authentication failed. Please try again.' });
    }
  };

  // SelectField Component for dropdowns
  const SelectField = ({ value, onValueChange, options, placeholder, focused, onFocus, onBlur }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = (e) => {
      // Prevent event propagation to avoid double-click issues
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      if (!isOpen) {
        setIsOpen(true);
        onFocus();
      } else {
        setIsOpen(false);
        onBlur();
      }
    };

    const handleSelect = (option) => {
      onValueChange(option);
      setIsOpen(false);
      onBlur();
    };

    const handleClose = () => {
      setIsOpen(false);
      onBlur();
    };

    return (
      <View style={[styles.selectContainer, isOpen && styles.selectContainerOpen]}>
        <Pressable
          style={[
            styles.selectInput,
            focused && styles.inputFocused,
            isOpen && styles.selectInputOpen
          ]}
          onPress={handleToggle}
          hitSlop={0}
          accessibilityRole="button"
          accessibilityLabel={`Toggle ${placeholder}`}
        >
          <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
            {value || placeholder}
          </Text>
          <View style={styles.selectArrow}>
            <View style={[styles.arrowTriangle, isOpen && styles.arrowTriangleUp]} />
          </View>
        </Pressable>
        {isOpen && (
          <>
            <Pressable
              style={styles.dropdownOverlay}
              onPress={handleClose}
            />
            <View style={styles.selectOptionsContainer}>
              <ScrollView
                style={styles.selectOptionsScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {options.map((option, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.selectOption,
                      value === option && styles.selectOptionSelected
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      value === option && styles.selectOptionTextSelected
                    ]} numberOfLines={1}>
                      {option || placeholder}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient
        colors={THEME.gradients.page}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.card, !isWideLayout && { paddingVertical: 32, paddingHorizontal: 22 }]}>
              {/* Visual Background Elements */}
              <View style={styles.cardVisual}>
                <View style={styles.cardCircle1} />
                <View style={styles.cardCircle2} />
              </View>

              {/* Logo/Icon Section */}
              <View style={styles.logoContainer}>
                <Image
                  source={verexaLogo}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>
                  {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                </Text>
                <Text style={styles.subtitle}>
                  {isSignUp
                    ? 'Start your journey to find your dream career'
                    : 'Sign in to continue to your career journey'}
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                {errors.general && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorBoxText}>{errors.general}</Text>
                  </View>
                )}
                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        focusedInput === 'name' && styles.inputFocused,
                        errors.name && styles.inputError
                      ]}
                      placeholder="John Doe"
                      placeholderTextColor="#8B7AB8"
                      value={name}
                      onChangeText={setName}
                      onSubmitEditing={handleSubmit}
                      returnKeyType="done"
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'email' && styles.inputFocused,
                      errors.email && styles.inputError
                    ]}
                    placeholder="you@example.com"
                    placeholderTextColor="#8B7AB8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onSubmitEditing={handleSubmit}
                    returnKeyType="done"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'password' && styles.inputFocused,
                      errors.password && styles.inputError
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor="#8B7AB8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onSubmitEditing={handleSubmit}
                    returnKeyType="done"
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={[
                        styles.input,
                        focusedInput === 'confirmPassword' && styles.inputFocused,
                        errors.confirmPassword && styles.inputError
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor="#8B7AB8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      onSubmitEditing={handleSubmit}
                      returnKeyType="done"
                      onFocus={() => setFocusedInput('confirmPassword')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                  </View>
                )}

                {/* Submit Button */}
                <Pressable
                  style={[
                    styles.submitButton,
                    hoveredButton === 'submit' && styles.submitButtonHover
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('submit')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Text>
                  )}
                </Pressable>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.googleSection}>
                  {Platform.OS === 'web' && canUseGoogleGsi && (
                    <View style={styles.googleButtonContainer}>
                      <View ref={googleButtonHostRef} style={styles.googleButtonHost} />
                      <Pressable
                        style={styles.googleFallbackButton}
                        onPress={handleGoogleContinue}
                        disabled={!isGoogleReady}
                      >
                        <View style={styles.googleButtonInner}>
                          <View style={styles.googleIconBadge}>
                            <FontAwesome name="google" size={16} color="#ffffff" />
                          </View>
                          <Text style={styles.googleFallbackButtonText}>Continue with Google</Text>
                        </View>
                      </Pressable>
                    </View>
                  )}
                  {!(Platform.OS === 'web' && canUseGoogleGsi) && (
                    <Pressable
                      style={styles.googleFallbackButton}
                      onPress={handleGoogleContinue}
                    >
                      <View style={styles.googleButtonInner}>
                        <View style={styles.googleIconBadge}>
                          <FontAwesome name="google" size={16} color="#ffffff" />
                        </View>
                        <Text style={styles.googleFallbackButtonText}>Continue with Google</Text>
                      </View>
                    </Pressable>
                  )}
                  {googleLoading && (
                    <View style={styles.googleLoadingRow}>
                      <ActivityIndicator size="small" color={THEME.colors.textSecondary} />
                    </View>
                  )}
                  {Platform.OS === 'web' && hasGoogleClientId && !googleOriginAllowed && (
                    <Text style={styles.googleHintText}>
                      Google sign-in disabled: add this web origin to backend env GOOGLE_ALLOWED_ORIGINS and Google OAuth authorized origins.
                    </Text>
                  )}
                </View>

                {/* Switch Mode Button */}
                <Pressable
                  style={[
                    styles.switchButton,
                    hoveredSwitch && styles.switchButtonHover
                  ]}
                  onPress={() => setIsSignUp(!isSignUp)}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredSwitch(true)}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredSwitch(false)}
                >
                  <Text style={styles.switchText}>
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <Text style={styles.switchLink}>
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
