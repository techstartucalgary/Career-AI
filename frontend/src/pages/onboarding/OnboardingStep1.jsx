import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './OnboardingStep1.styles';

const OnboardingStep1 = ({ formData, onNext, onBack }) => {
  const [localData, setLocalData] = useState({
    firstName: formData.firstName || '',
    lastName: formData.lastName || '',
    cellPhone: formData.cellPhone || '',
    linkedinUrl: formData.linkedinUrl || '',
    githubUrl: formData.githubUrl || '',
    location: formData.location || '',
  });
  const [focusedInput, setFocusedInput] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  // Auto-fill from extracted resume data
  useEffect(() => {
    if (formData.extractedData) {
      const extracted = formData.extractedData;
      setLocalData(prev => ({
        ...prev,
        firstName: prev.firstName || extracted.firstName || '',
        lastName: prev.lastName || extracted.lastName || '',
        cellPhone: prev.cellPhone || extracted.phone || extracted.cellPhone || '',
        linkedinUrl: prev.linkedinUrl || extracted.linkedin || extracted.linkedinUrl || '',
        githubUrl: prev.githubUrl || extracted.github || extracted.githubUrl || '',
        location: prev.location || extracted.location || extracted.city || '',
      }));
    }
  }, [formData.extractedData]);

  const handleChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    onNext(localData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Fill out your information once, and we'll use it for every job application
        </Text>
        {formData.email && (
          <View style={styles.emailDisplay}>
            <Text style={styles.emailLabel}>Email:</Text>
            <Text style={styles.emailValue}>{formData.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.formCard}>
        <View style={styles.formRow}>
          {/* Left Column */}
          <View style={styles.formColumn}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'firstName' && styles.inputFocused
                ]}
                placeholder="Enter Here"
                placeholderTextColor="#8B7AB8"
                value={localData.firstName}
                onChangeText={(value) => handleChange('firstName', value)}
                onFocus={() => setFocusedInput('firstName')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Linkedin URL</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'linkedinUrl' && styles.inputFocused
                ]}
                placeholder="www.linkedin.com/in/example"
                placeholderTextColor="#8B7AB8"
                value={localData.linkedinUrl}
                onChangeText={(value) => handleChange('linkedinUrl', value)}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('linkedinUrl')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'location' && styles.inputFocused
                ]}
                placeholder="City, Country"
                placeholderTextColor="#8B7AB8"
                value={localData.location}
                onChangeText={(value) => handleChange('location', value)}
                onFocus={() => setFocusedInput('location')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.formColumn}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'lastName' && styles.inputFocused
                ]}
                placeholder="Enter Here"
                placeholderTextColor="#8B7AB8"
                value={localData.lastName}
                onChangeText={(value) => handleChange('lastName', value)}
                onFocus={() => setFocusedInput('lastName')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cell Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'cellPhone' && styles.inputFocused
                ]}
                placeholder="(--) --- ----"
                placeholderTextColor="#8B7AB8"
                value={localData.cellPhone}
                onChangeText={(value) => handleChange('cellPhone', value)}
                keyboardType="phone-pad"
                onFocus={() => setFocusedInput('cellPhone')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Github URL</Text>
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

