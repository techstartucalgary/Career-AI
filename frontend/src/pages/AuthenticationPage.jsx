import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './AuthenticationPage.styles';

export default function AuthenticationPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [sex, setSex] = useState('');
  const [gender, setGender] = useState('');
  const [disability, setDisability] = useState('');
  const [race, setRace] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredSwitch, setHoveredSwitch] = useState(false);

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
    // Replace with your auth logic (Firebase, Supabase, etc.)
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    // Navigate to onboarding for new sign-ups, home for existing users
    if (isSignUp) {
      router.push({
        pathname: '/onboarding',
        params: { email: email }
      });
    } else {
      router.push('/home');
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
        colors={['#1F1C2F', '#2D1B3D', '#1F1C2F']} 
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
            <View style={styles.card}>
              {/* Visual Background Elements */}
              <View style={styles.cardVisual}>
                <View style={styles.cardCircle1} />
                <View style={styles.cardCircle2} />
              </View>
              
              {/* Logo/Icon Section */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <View style={styles.logoStar} />
                </View>
                <Text style={styles.logoText}>Verexa</Text>
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
                      onFocus={() => setFocusedInput('confirmPassword')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                  </View>
                )}

                {/* Demographic Information Section */}
                {isSignUp && (
                  <>
                    <View style={styles.demographicSection}>
                      <Text style={styles.demographicTitle}>Demographic Information (Optional)</Text>
                      <Text style={styles.demographicSubtitle}>
                        This information helps us provide better opportunities and is kept confidential
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Sex</Text>
                      <SelectField
                        value={sex}
                        onValueChange={setSex}
                        options={['', 'Male', 'Female', 'Intersex', 'Prefer not to say']}
                        placeholder="Select sex"
                        focused={focusedInput === 'sex'}
                        onFocus={() => setFocusedInput('sex')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Gender</Text>
                      <SelectField
                        value={gender}
                        onValueChange={setGender}
                        options={['', 'Man', 'Woman', 'Non-binary', 'Genderqueer', 'Two-Spirit', 'Another gender', 'Prefer not to say']}
                        placeholder="Select gender"
                        focused={focusedInput === 'gender'}
                        onFocus={() => setFocusedInput('gender')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Disability Status</Text>
                      <SelectField
                        value={disability}
                        onValueChange={setDisability}
                        options={['', 'Yes, I have a disability', 'No, I do not have a disability', 'Prefer not to say']}
                        placeholder="Select disability status"
                        focused={focusedInput === 'disability'}
                        onFocus={() => setFocusedInput('disability')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Race/Ethnicity</Text>
                      <SelectField
                        value={race}
                        onValueChange={setRace}
                        options={['', 'American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic or Latino', 'Native Hawaiian or Other Pacific Islander', 'White', 'Two or more races', 'Another race/ethnicity', 'Prefer not to say']}
                        placeholder="Select race/ethnicity"
                        focused={focusedInput === 'race'}
                        onFocus={() => setFocusedInput('race')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </>
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
