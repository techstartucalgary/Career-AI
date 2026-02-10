import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './OnboardingStep1.styles';

const OnboardingStep1 = ({ formData, onNext, onBack }) => {
  // Prevent going back without completing step
  const [localData, setLocalData] = useState({
    firstName: formData.firstName || '',
    lastName: formData.lastName || '',
    cellPhone: formData.cellPhone || '',
    linkedinUrl: formData.linkedinUrl || '',
    githubUrl: formData.githubUrl || '',
    website: formData.website || '',
    location: formData.location || '',
  });
  const [focusedInput, setFocusedInput] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [errors, setErrors] = useState({});

  // Auto-fill from extracted resume data
  useEffect(() => {
    if (formData.extractedData) {
      const extracted = formData.extractedData;
      
      // Parse full name into first and last
      const fullName = extracted.name || '';
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setLocalData(prev => ({
        ...prev,
        firstName: prev.firstName || firstName || '',
        lastName: prev.lastName || lastName || '',
        cellPhone: prev.cellPhone || extracted.phone || '',
        linkedinUrl: prev.linkedinUrl || extracted.linkedin || '',
        githubUrl: prev.githubUrl || extracted.github || '',
        location: prev.location || extracted.location || '',
      }));
    }
  }, [formData.extractedData]);

  const handleChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!localData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!localData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!localData.cellPhone.trim()) newErrors.cellPhone = 'Phone number is required';
    if (!localData.linkedinUrl.trim()) newErrors.linkedinUrl = 'LinkedIn URL is required';
    if (!localData.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    onNext(localData);
  };

  return (
    <View style={styles.container}>
      {formData.email && (
        <View style={styles.emailBadge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{formData.email}</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Fill out your information once, and we'll use it for every job application
        </Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.formRow}>
          {/* Left Column */}
          <View style={styles.formColumn}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First name*</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'firstName' && styles.inputFocused,
                  errors.firstName && styles.inputError
                ]}
                placeholder="Enter Here"
                placeholderTextColor="#8B7AB8"
                value={localData.firstName}
                onChangeText={(value) => handleChange('firstName', value)}
                onFocus={() => setFocusedInput('firstName')}
                onBlur={() => setFocusedInput(null)}
                autoComplete="given-name"
                name="firstName"
                id="firstName"
              />
              {!!errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LinkedIn URL*</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'linkedinUrl' && styles.inputFocused,
                  errors.linkedinUrl && styles.inputError
                ]}
                placeholder="www.linkedin.com/in/example"
                placeholderTextColor="#8B7AB8"
                value={localData.linkedinUrl}
                onChangeText={(value) => handleChange('linkedinUrl', value)}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('linkedinUrl')}
                onBlur={() => setFocusedInput(null)}
                autoComplete="url"
                name="linkedinUrl"
                id="linkedinUrl"
              />
              {!!errors.linkedinUrl && (
                <Text style={styles.errorText}>{errors.linkedinUrl}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Personal Website</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'website' && styles.inputFocused
                ]}
                placeholder="https://your-portfolio.com"
                placeholderTextColor="#8B7AB8"
                value={localData.website}
                onChangeText={(value) => handleChange('website', value)}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('website')}
                onBlur={() => setFocusedInput(null)}
                autoComplete="url"
                name="website"
                id="website"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location*</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'location' && styles.inputFocused,
                  errors.location && styles.inputError
                ]}
                placeholder="City, Country"
                placeholderTextColor="#8B7AB8"
                value={localData.location}
                onChangeText={(value) => handleChange('location', value)}
                onFocus={() => setFocusedInput('location')}
                onBlur={() => setFocusedInput(null)}
                autoComplete="off"
                name="location"
                id="location"
              />
              {!!errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.formColumn}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last name*</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'lastName' && styles.inputFocused,
                  errors.lastName && styles.inputError
                ]}
                placeholder="Enter Here"
                placeholderTextColor="#8B7AB8"
                value={localData.lastName}
                onChangeText={(value) => handleChange('lastName', value)}
                onFocus={() => setFocusedInput('lastName')}
                onBlur={() => setFocusedInput(null)}
                autoComplete="family-name"
                name="lastName"
                id="lastName"
              />
              {!!errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cell Phone Number*</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'cellPhone' && styles.inputFocused,
                  errors.cellPhone && styles.inputError
                ]}
                placeholder="(--) --- ----"
                placeholderTextColor="#8B7AB8"
                value={localData.cellPhone}
                onChangeText={(value) => handleChange('cellPhone', value)}
                keyboardType="phone-pad"
                onFocus={() => setFocusedInput('cellPhone')}
                onBlur={() => setFocusedInput(null)}
                autoComplete="tel"
                name="cellPhone"
                id="cellPhone"
              />
              {!!errors.cellPhone && (
                <Text style={styles.errorText}>{errors.cellPhone}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GitHub URL</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'githubUrl' && styles.inputFocused
                ]}
                placeholder="https://github.com/example"
                placeholderTextColor="#8B7AB8"
                value={localData.githubUrl}
                onChangeText={(value) => handleChange('githubUrl', value)}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('githubUrl')}
                onBlur={() => setFocusedInput(null)}
                autoComplete="url"
                name="githubUrl"
                id="githubUrl"
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.navigation}>
        <Pressable
          style={[
            styles.backButton,
            hoveredButton === 'back' && styles.backButtonHover
          ]}
          onPress={onBack}
          onHoverIn={() => Platform.OS === 'web' && setHoveredButton('back')}
          onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Pressable
          style={[
            styles.continueButton,
            hoveredButton === 'continue' && styles.continueButtonHover
          ]}
          onPress={handleContinue}
          onHoverIn={() => Platform.OS === 'web' && setHoveredButton('continue')}
          onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
        >
          <Text style={styles.continueButtonText}>Save and Continue</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default OnboardingStep1;

