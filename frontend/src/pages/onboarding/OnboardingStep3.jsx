import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform } from 'react-native';
import styles from './OnboardingStep3.styles';

const OnboardingStep3 = ({ formData, onNext, onBack }) => {
  const [localData, setLocalData] = useState({
    positions: formData.positions || [],
    locations: formData.locations || [],
    workArrangement: formData.workArrangement || 'any',
  });
  const [positionInput, setPositionInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [errors, setErrors] = useState({});

  const handleAddPosition = () => {
    if (positionInput.trim() && !localData.positions.includes(positionInput.trim())) {
      setLocalData(prev => ({
        ...prev,
        positions: [...prev.positions, positionInput.trim()]
      }));
      setPositionInput('');
      if (errors.positions) {
        setErrors(prev => ({ ...prev, positions: undefined }));
      }
    }
  };

  const handleRemovePosition = (position) => {
    setLocalData(prev => ({
      ...prev,
      positions: prev.positions.filter(p => p !== position)
    }));
  };

  const handleAddLocation = () => {
    if (locationInput.trim() && !localData.locations.includes(locationInput.trim())) {
      setLocalData(prev => ({
        ...prev,
        locations: [...prev.locations, locationInput.trim()]
      }));
      setLocationInput('');
      if (errors.locations) {
        setErrors(prev => ({ ...prev, locations: undefined }));
      }
    }
  };

  const handleRemoveLocation = (location) => {
    setLocalData(prev => ({
      ...prev,
      locations: prev.locations.filter(l => l !== location)
    }));
  };

  const handleWorkArrangementChange = (arrangement) => {
    setLocalData(prev => ({ ...prev, workArrangement: arrangement }));
  };

  const validate = () => {
    const newErrors = {};
    if (localData.positions.length === 0) {
      newErrors.positions = 'Add at least one desired position';
    }
    if (localData.locations.length === 0) {
      newErrors.locations = 'Add at least one desired location';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
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
        <Text style={styles.title}>Finally, Tell Us What You're Looking For</Text>
        <Text style={styles.subtitle}>
          This will help us find the best fit jobs for you
        </Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.formRow}>
          {/* Left Column */}
          <View style={styles.formColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Positions*</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'position' && styles.inputFocused
                  ]}
                  placeholder="e.g. Data Analysis"
                  placeholderTextColor="#8B7AB8"
                  value={positionInput}
                  onChangeText={setPositionInput}
                  onSubmitEditing={handleAddPosition}
                  onFocus={() => setFocusedInput('position')}
                  onBlur={() => setFocusedInput(null)}
                  autoComplete="off"
                  name="position"
                  id="position"
                />
                <Pressable
                  style={styles.addButton}
                  onPress={handleAddPosition}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </Pressable>
              </View>
              {localData.positions.length > 0 && (
                <View style={styles.tagsContainer}>
                  {localData.positions.map((position, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{position}</Text>
                      <Pressable
                        style={styles.tagRemove}
                        onPress={() => handleRemovePosition(position)}
                      >
                        <Text style={styles.tagRemoveText}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              {!!errors.positions && (
                <Text style={styles.errorText}>{errors.positions}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Locations*</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'location' && styles.inputFocused
                  ]}
                  placeholder="e.g. Calgary, AB, Canada"
                  placeholderTextColor="#8B7AB8"
                  value={locationInput}
                  onChangeText={setLocationInput}
                  onSubmitEditing={handleAddLocation}
                  onFocus={() => setFocusedInput('location')}
                  onBlur={() => setFocusedInput(null)}
                  autoComplete="off"
                  name="locationInput"
                  id="locationInput"
                />
                <Pressable
                  style={styles.addButton}
                  onPress={handleAddLocation}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </Pressable>
              </View>
              {localData.locations.length > 0 && (
                <View style={styles.tagsContainer}>
                  {localData.locations.map((location, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{location}</Text>
                      <Pressable
                        style={styles.tagRemove}
                        onPress={() => handleRemoveLocation(location)}
                      >
                        <Text style={styles.tagRemoveText}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              {!!errors.locations && (
                <Text style={styles.errorText}>{errors.locations}</Text>
              )}
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.formColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Work Arrangement*</Text>
              <View style={styles.checkboxContainer}>
                {[
                  { value: 'any', label: 'Any (Remote, Hybrid, On-Site)' },
                  { value: 'remote', label: 'Remote Only' },
                  { value: 'onsite', label: 'On Site / Hybrid Only' },
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    style={styles.checkboxRow}
                    onPress={() => handleWorkArrangementChange(option.value)}
                  >
                    <View style={[
                      styles.checkbox,
                      localData.workArrangement === option.value && styles.checkboxChecked
                    ]}>
                      {localData.workArrangement === option.value && (
                        <View style={styles.checkmark}>
                          <View style={styles.checkmarkLine1} />
                          <View style={styles.checkmarkLine2} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
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
            styles.saveButton,
            hoveredButton === 'save' && styles.saveButtonHover
          ]}
          onPress={handleSave}
          onHoverIn={() => Platform.OS === 'web' && setHoveredButton('save')}
          onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default OnboardingStep3;



