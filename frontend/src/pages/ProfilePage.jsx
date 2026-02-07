import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from './ProfilePage.styles';
import { apiFetch, clearAuthToken, getAuthToken } from '../services/api';
import { Redirect } from 'expo-router';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('');
  const [preferredPositions, setPreferredPositions] = useState([]);
  const [preferredLocations, setPreferredLocations] = useState([]);
  const [workArrangement, setWorkArrangement] = useState('any');
  const [positionInput, setPositionInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [identification, setIdentification] = useState({
    sex: '',
    gender: '',
    disability: '',
    race: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    let isActive = true;

    const token = getAuthToken();
    if (!token) {
      setShouldRedirect(true);
      return () => {
        isActive = false;
      };
    }

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setProfileError('');
        const response = await apiFetch('/profile');
        const data = response && response.data ? response.data : {};
        const profile = data.profile || {};

        const isBcrypt = (value) => typeof value === 'string' && value.startsWith('$2');
        const first = profile.first_name || (isBcrypt(data.first_name) ? '' : data.first_name) || '';
        const last = profile.last_name || (isBcrypt(data.last_name) ? '' : data.last_name) || '';
        const fullName = `${first} ${last}`.trim();
        const combinedName = data.name || fullName;

        const tierLabel = data.role
          ? data.role
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          : '';

        if (!isActive) return;

        setName(combinedName);
        setEmail(data.email || '');
        setPhone(profile.phone || '');
        setLocation(profile.location || '');
        setLinkedin(profile.linkedin || '');
        setGithub(profile.github || '');
        setWebsite(profile.website || '');
        setSubscriptionTier(tierLabel);
        const preferences = data.job_preferences || {};
        setPreferredPositions(preferences.positions || []);
        setPreferredLocations(preferences.locations || []);
        setWorkArrangement(preferences.work_arrangement || 'any');
        setIdentification({
          sex: data.sex || '',
          gender: data.gender || '',
          disability: data.disability || '',
          race: data.race || '',
        });
        
        // Load resume file name if exists
        const resume = data.resume || {};
        if (resume.file_name) {
          setResumeFileName(resume.file_name);
        }
      } catch (error) {
        if (!isActive) return;
        const message = error.message || 'Unable to load profile.';
        setProfileError(message);
        if (message.toLowerCase().includes('token') || message.includes('401')) {
          clearAuthToken();
          setShouldRedirect(true);
        }
      } finally {
        if (isActive) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, []);

  if (shouldRedirect) {
    return <Redirect href="/authentication" />;
  }

  const handleSave = async () => {
    if (saving) return;
    setSaveError('');
    setSaveSuccess('');
    setSaving(true);

    const trimmedName = name.trim();
    const nameParts = trimmedName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    const profilePayload = {};
    if (firstName) profilePayload.first_name = firstName;
    if (lastName) profilePayload.last_name = lastName;
    if (phone.trim()) profilePayload.phone = phone.trim();
    if (location.trim()) profilePayload.location = location.trim();
    if (linkedin.trim()) profilePayload.linkedin = linkedin.trim();
    if (github.trim()) profilePayload.github = github.trim();
    if (website.trim()) profilePayload.website = website.trim();

    const preferencesPayload = {
      positions: preferredPositions,
      locations: preferredLocations,
      work_arrangement: workArrangement,
    };

    const demographicsPayload = {
      sex: identification.sex,
      gender: identification.gender,
      disability: identification.disability,
      race: identification.race,
    };

    try {
      await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(profilePayload),
      });
      await apiFetch('/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferencesPayload),
      });
      const hasDemographics = Object.values(demographicsPayload).some((value) => value);
      if (hasDemographics) {
        await apiFetch('/demographics', {
          method: 'PUT',
          body: JSON.stringify(demographicsPayload),
        });
      }
      setSaveSuccess('Profile updated.');
    } catch (error) {
      setSaveError(error.message || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingResume(true);
        setResumeError('');
        
        const file = result.assets[0];
        const formDataObj = new FormData();
        const resumePart = file.file
          ? file.file
          : {
              uri: file.uri,
              name: file.name || 'resume.pdf',
              type: file.mimeType || 'application/pdf',
            };
        const resumeName = resumePart?.name || file.name || 'resume.pdf';
        formDataObj.append('resume_file', resumePart, resumeName);
        
        // Parse and upload resume
        const response = await fetch('http://localhost:8000/resume/upload', {
          method: 'POST',
          body: formDataObj,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('career_ai_token')}`,
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          const message = data?.message || data?.detail || 'Failed to upload resume';
          throw new Error(message);
        }
        
        setResumeFileName(data.data?.file_name || file.name);
        setSaveSuccess('Resume uploaded successfully.');
        
        // Reload profile to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setResumeError(error.message || 'Error uploading resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const workArrangementOptions = [
    { value: 'any', label: 'Any (Remote, Hybrid, On-Site)' },
    { value: 'remote', label: 'Remote Only' },
    { value: 'onsite', label: 'On Site / Hybrid Only' },
  ];

  const sexOptions = ['Man', 'Woman', 'Another Gender', 'I do not wish to answer'];
  const genderOptions = ['Man', 'Woman', 'Non-Binary', 'Two-Spirit', 'Another Gender', 'I do not wish to answer'];
  const disabilityOptions = ['Yes', 'No', 'I do not wish to answer'];
  const raceOptions = ['Yes', 'No', 'I do not wish to answer'];

  const handleAddPosition = () => {
    const trimmed = positionInput.trim();
    if (!trimmed || preferredPositions.includes(trimmed)) return;
    setPreferredPositions((prev) => [...prev, trimmed]);
    setPositionInput('');
  };

  const handleRemovePosition = (position) => {
    setPreferredPositions((prev) => prev.filter((item) => item !== position));
  };

  const handleAddLocation = () => {
    const trimmed = locationInput.trim();
    if (!trimmed || preferredLocations.includes(trimmed)) return;
    setPreferredLocations((prev) => [...prev, trimmed]);
    setLocationInput('');
  };

  const handleRemoveLocation = (place) => {
    setPreferredLocations((prev) => prev.filter((item) => item !== place));
  };

  const updateIdentification = (field, value) => {
    setIdentification((prev) => ({ ...prev, [field]: value }));
  };

  const initials = name.trim()
    ? name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const displayName = name.trim() || 'Name not set';

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient 
        colors={['#1F1C2F', '#2D1B3D', '#1F1C2F']} 
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>My Profile</Text>
                <Text style={styles.subtitle}>Manage your personal information</Text>
              </View>
            </View>

            {loadingProfile && (
              <Text style={styles.statusText}>Loading profile...</Text>
            )}
            {!!profileError && (
              <Text style={styles.errorText}>{profileError}</Text>
            )}

            {/* Profile Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>
              <Text style={styles.avatarName}>{displayName}</Text>
              <Text style={styles.avatarRole}>{subscriptionTier || 'Subscription not set'}</Text>
            </View>

            {/* Info Cards */}
            <View style={styles.cardsContainer}>
              {/* Personal Information Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Personal Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, styles.readOnlyInput]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    editable={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter your location"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>LinkedIn</Text>
                  <TextInput
                    style={styles.input}
                    value={linkedin}
                    onChangeText={setLinkedin}
                    placeholder="https://linkedin.com/in/username"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>GitHub</Text>
                  <TextInput
                    style={styles.input}
                    value={github}
                    onChangeText={setGithub}
                    placeholder="https://github.com/username"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Personal Website</Text>
                  <TextInput
                    style={styles.input}
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://your-portfolio.com"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Job Preferences</Text>

                <View style={styles.preferenceSection}>
                  <Text style={styles.sectionTitle}>Positions</Text>
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Data Analyst"
                      placeholderTextColor="#6B7280"
                      value={positionInput}
                      onChangeText={setPositionInput}
                      onSubmitEditing={handleAddPosition}
                    />
                    <Pressable style={styles.addButton} onPress={handleAddPosition}>
                      <Text style={styles.addButtonText}>+</Text>
                    </Pressable>
                  </View>
                  {preferredPositions.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {preferredPositions.map((position, index) => (
                        <View key={`${position}-${index}`} style={styles.tag}>
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
                </View>

                <View style={styles.preferenceSection}>
                  <Text style={styles.sectionTitle}>Locations</Text>
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. New York, NY"
                      placeholderTextColor="#6B7280"
                      value={locationInput}
                      onChangeText={setLocationInput}
                      onSubmitEditing={handleAddLocation}
                    />
                    <Pressable style={styles.addButton} onPress={handleAddLocation}>
                      <Text style={styles.addButtonText}>+</Text>
                    </Pressable>
                  </View>
                  {preferredLocations.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {preferredLocations.map((place, index) => (
                        <View key={`${place}-${index}`} style={styles.tag}>
                          <Text style={styles.tagText}>{place}</Text>
                          <Pressable
                            style={styles.tagRemove}
                            onPress={() => handleRemoveLocation(place)}
                          >
                            <Text style={styles.tagRemoveText}>×</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.preferenceSection}>
                  <Text style={styles.sectionTitle}>Work Arrangement</Text>
                  <View style={styles.checkboxContainer}>
                    {workArrangementOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        style={styles.checkboxRow}
                        onPress={() => setWorkArrangement(option.value)}
                      >
                        <View style={[
                          styles.checkbox,
                          workArrangement === option.value && styles.checkboxChecked
                        ]}>
                          {workArrangement === option.value && (
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

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Identification</Text>

                <View style={styles.preferenceSection}>
                  <Text style={styles.sectionTitle}>Sex</Text>
                  <View style={styles.checkboxContainer}>
                    {sexOptions.map((option) => (
                      <Pressable
                        key={option}
                        style={styles.checkboxRow}
                        onPress={() => updateIdentification('sex', option)}
                      >
                        <View style={[
                          styles.checkbox,
                          identification.sex === option && styles.checkboxChecked
                        ]}>
                          {identification.sex === option && (
                            <View style={styles.checkmark}>
                              <View style={styles.checkmarkLine1} />
                              <View style={styles.checkmarkLine2} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.preferenceSection}>
                  <Text style={styles.sectionTitle}>Gender</Text>
                  <View style={styles.checkboxContainer}>
                    {genderOptions.map((option) => (
                      <Pressable
                        key={option}
                        style={styles.checkboxRow}
                        onPress={() => updateIdentification('gender', option)}
                      >
                        <View style={[
                          styles.checkbox,
                          identification.gender === option && styles.checkboxChecked
                        ]}>
                          {identification.gender === option && (
                            <View style={styles.checkmark}>
                              <View style={styles.checkmarkLine1} />
                              <View style={styles.checkmarkLine2} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.preferenceSection}>
                  <Text style={styles.sectionTitle}>Disability</Text>
                  <View style={styles.checkboxContainer}>
                    {disabilityOptions.map((option) => (
                      <Pressable
                        key={option}
                        style={styles.checkboxRow}
                        onPress={() => updateIdentification('disability', option)}
                      >
                        <View style={[
                          styles.checkbox,
                          identification.disability === option && styles.checkboxChecked
                        ]}>
                          {identification.disability === option && (
                            <View style={styles.checkmark}>
                              <View style={styles.checkmarkLine1} />
                              <View style={styles.checkmarkLine2} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.preferenceSection}>
                  <Text style={styles.sectionTitle}>Race</Text>
                  <View style={styles.checkboxContainer}>
                    {raceOptions.map((option) => (
                      <Pressable
                        key={option}
                        style={styles.checkboxRow}
                        onPress={() => updateIdentification('race', option)}
                      >
                        <View style={[
                          styles.checkbox,
                          identification.race === option && styles.checkboxChecked
                        ]}>
                          {identification.race === option && (
                            <View style={styles.checkmark}>
                              <View style={styles.checkmarkLine1} />
                              <View style={styles.checkmarkLine2} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Resume Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Resume</Text>
                
                {resumeFileName ? (
                  <View style={styles.resumeContainer}>
                    <Text style={styles.resumeLabel}>Current Resume:</Text>
                    <Text style={styles.resumeFileName}>{resumeFileName}</Text>
                  </View>
                ) : (
                  <Text style={styles.noResumeText}>No resume uploaded yet</Text>
                )}
                
                <Pressable 
                  style={[styles.uploadButton, uploadingResume && styles.uploadButtonDisabled]}
                  onPress={handleResumeUpload}
                  disabled={uploadingResume}
                >
                  <Text style={styles.uploadButtonText}>
                    {uploadingResume ? 'Uploading...' : 'Upload or Replace Resume'}
                  </Text>
                </Pressable>
                
                {!!resumeError && <Text style={styles.errorText}>{resumeError}</Text>}
              </View>

              {/* Stats Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Profile Stats</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>23</Text>
                    <Text style={styles.statLabel}>Applications</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>5</Text>
                    <Text style={styles.statLabel}>Interviews</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>87%</Text>
                    <Text style={styles.statLabel}>Success Rate</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <Pressable 
              disabled={saving || loadingProfile}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && !saving && styles.saveButtonPressed,
                (saving || loadingProfile) && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
            >
              <LinearGradient
                colors={['#A78BFA', '#8B7AB8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </Pressable>
            {!!saveError && <Text style={styles.errorText}>{saveError}</Text>}
            {!!saveSuccess && <Text style={styles.successText}>{saveSuccess}</Text>}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
