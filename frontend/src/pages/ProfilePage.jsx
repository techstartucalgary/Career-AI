import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Image, Platform, Modal, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from './ProfilePage.styles';
import { THEME } from '../styles/theme';
import { API_BASE_URL, apiFetch, apiUrl, clearAuthToken, getAuthToken, getUserProfile, clearUserProfileCache } from '../services/api';
import { Redirect } from 'expo-router';
import { useBreakpoints } from '../hooks/useBreakpoints';

const PROFILE_NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal' },
  { id: 'preferences', label: 'Job preferences' },
  { id: 'identification', label: 'Identification' },
  { id: 'resume', label: 'Resume' },
  { id: 'stats', label: 'Profile stats' },
];

function buildProfileFormSnapshot({
  name,
  phone,
  location,
  linkedin,
  github,
  website,
  preferredPositions,
  preferredLocations,
  workArrangement,
  identification,
}) {
  return JSON.stringify({
    name: name.trim(),
    phone: phone.trim(),
    location: location.trim(),
    linkedin: linkedin.trim(),
    github: github.trim(),
    website: website.trim(),
    preferredPositions: [...preferredPositions],
    preferredLocations: [...preferredLocations],
    workArrangement,
    identification: { ...identification },
  });
}

/** Must match strings saved by onboarding (OnboardingStep4) so GET /profile values match a radio. */
const SEX_OPTIONS = ['Male', 'Female', 'Intersex', 'Prefer not to say', 'Another Gender'];
const GENDER_OPTIONS = [
  'Man',
  'Woman',
  'Non-binary',
  'Genderqueer',
  'Two-Spirit',
  'Another gender',
  'Prefer not to say',
];
const DISABILITY_OPTIONS = [
  'Yes, I have a disability',
  'No, I do not have a disability',
  'Prefer not to say',
];
const RACE_ETHNICITY_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Other Pacific Islander',
  'White',
  'Two or more races',
  'Another race/ethnicity',
  'Prefer not to say',
];

const IdentificationSelectField = ({
  fieldKey,
  value,
  onValueChange,
  options,
  placeholder,
  focused,
  onFocus,
  onBlur,
  isOpen,
  onToggleOpen,
  onClose,
}) => {
  const triggerRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  const measureTrigger = useCallback((callback) => {
    if (!triggerRef.current || typeof triggerRef.current.measureInWindow !== 'function') {
      callback?.();
      return;
    }

    triggerRef.current.measureInWindow((x, y, width, height) => {
      const windowHeight = Dimensions.get('window').height || 0;
      const estimatedMenuHeight = Math.min(options.length * 44 + 8, 220);
      const shouldOpenUp = y + height + estimatedMenuHeight > windowHeight - 16;

      setMenuPosition({
        top: shouldOpenUp ? Math.max(12, y - estimatedMenuHeight - 4) : y + height,
        left: x,
        width,
      });

      callback?.();
    });
  }, [options.length]);

  const handleToggle = () => {
    if (isOpen) {
      onToggleOpen(fieldKey);
      onBlur();
      return;
    }

    measureTrigger(() => {
      onToggleOpen(fieldKey);
      onFocus();
    });
  };

  const handleSelect = (option) => {
    onValueChange(option);
    onClose();
    onBlur();
  };

  const handleClose = () => {
    onClose();
    onBlur();
  };

  return (
    <View style={[styles.selectContainer, isOpen && styles.selectContainerOpen]}>
      <Pressable
        ref={triggerRef}
        style={[
          styles.selectInput,
          styles.selectInputLayer,
          focused && styles.selectInputFocused,
          isOpen && styles.selectInputOpen,
        ]}
        onPress={handleToggle}
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
        <Modal transparent visible animationType="none" onRequestClose={handleClose}>
          <View style={styles.selectModalRoot}>
            <Pressable style={styles.selectModalOverlay} onPress={handleClose} />
            <View
              style={[
                styles.selectModalOptionsContainer,
                {
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: menuPosition.width,
                },
              ]}
            >
              <ScrollView style={styles.selectOptionsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {options.map((option, index) => (
                  <Pressable
                    key={`${fieldKey}-${index}`}
                    style={[styles.selectOption, value === option && styles.selectOptionSelected]}
                    onPress={() => handleSelect(option)}
                  >
                    <Text
                      style={[styles.selectOptionText, value === option && styles.selectOptionTextSelected]}
                      numberOfLines={1}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

/** Map older profile-only values onto onboarding labels where obvious. */
function normalizeIdentificationFromApi(raw) {
  const sex = raw.sex || '';
  let s = sex;
  if (sex === 'Man') s = 'Male';
  else if (sex === 'Woman') s = 'Female';
  else if (sex === 'I do not wish to answer') s = 'Prefer not to say';

  const gender = raw.gender || '';
  let g = gender;
  if (gender === 'Non-Binary') g = 'Non-binary';
  else if (gender === 'Another Gender') g = 'Another gender';

  const disability = raw.disability || '';
  let d = disability;
  if (disability === 'Yes') d = 'Yes, I have a disability';
  else if (disability === 'No') d = 'No, I do not have a disability';
  else if (disability === 'I do not wish to answer') d = 'Prefer not to say';

  const race = raw.race || '';
  let r = race;
  if (race === 'Yes' || race === 'No' || race === 'I do not wish to answer') {
    r = '';
  }

  return { sex: s, gender: g, disability: d, race: r };
}

export default function ProfilePage() {
  const { isWideLayout, isDesktop } = useBreakpoints();
  const scrollRef = useRef(null);
  const sectionYs = useRef({});
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
  const [focusedIdentificationField, setFocusedIdentificationField] = useState(null);
  const [openIdentificationDropdown, setOpenIdentificationDropdown] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const notifyProfileUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('career-ai-profile-updated'));
    }
  };
  const [saving, setSaving] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeFileData, setResumeFileData] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [removingResume, setRemovingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [avatarImageUri, setAvatarImageUri] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  /** JSON snapshot of last loaded/saved form fields; null until profile load completes */
  const [savedBaseline, setSavedBaseline] = useState(null);

  const formFingerprint = useMemo(
    () =>
      buildProfileFormSnapshot({
        name,
        phone,
        location,
        linkedin,
        github,
        website,
        preferredPositions,
        preferredLocations,
        workArrangement,
        identification,
      }),
    [
      name,
      phone,
      location,
      linkedin,
      github,
      website,
      preferredPositions,
      preferredLocations,
      workArrangement,
      identification,
    ]
  );

  const hasUnsavedChanges =
    savedBaseline !== null && !loadingProfile && formFingerprint !== savedBaseline;

  useEffect(() => {
    if (hasUnsavedChanges) {
      setSaveSuccess('');
    }
  }, [hasUnsavedChanges]);

  const navSections = useMemo(
    () => PROFILE_NAV_SECTIONS.filter((s) => !(isDesktop && s.id === 'stats')),
    [isDesktop]
  );

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
        setSavedBaseline(null);
        setProfileError('');
        const response = await getUserProfile({ forceRefresh: true });
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
        setPreferredPositions(Array.isArray(preferences.positions) ? preferences.positions : []);
        setPreferredLocations(Array.isArray(preferences.locations) ? preferences.locations : []);
        setWorkArrangement(preferences.work_arrangement || 'any');
        const idVal = (v) => (isBcrypt(v) ? '' : v || '');
        const idRaw = normalizeIdentificationFromApi({
          sex: idVal(data.sex),
          gender: idVal(data.gender),
          disability: idVal(data.disability),
          race: idVal(data.race),
        });
        setIdentification({
          sex: idRaw.sex,
          gender: idRaw.gender,
          disability: idRaw.disability,
          race: idRaw.race,
        });
        
        // Load resume file name if exists
        const resume = data.resume || {};
        if (resume.file_name) {
          setResumeFileName(resume.file_name);
        }
        if (resume.file_data) {
          setResumeFileData(resume.file_data);
        }

        if (profile.avatar_opt_out) {
          setAvatarImageUri(null);
        } else if (profile.avatar_base64 && profile.avatar_mime) {
          setAvatarImageUri(`data:${profile.avatar_mime};base64,${profile.avatar_base64}`);
        } else {
          setAvatarImageUri(profile.avatar_url || profile.picture || data.avatar_url || data.picture || null);
        }

        setSavedBaseline(
          buildProfileFormSnapshot({
            name: combinedName,
            phone: profile.phone || '',
            location: profile.location || '',
            linkedin: profile.linkedin || '',
            github: profile.github || '',
            website: profile.website || '',
            preferredPositions: Array.isArray(preferences.positions) ? preferences.positions : [],
            preferredLocations: Array.isArray(preferences.locations) ? preferences.locations : [],
            workArrangement: preferences.work_arrangement || 'any',
            identification: {
              sex: idRaw.sex,
              gender: idRaw.gender,
              disability: idRaw.disability,
              race: idRaw.race,
            },
          })
        );
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

  const onSectionLayout = useCallback((id) => (e) => {
    sectionYs.current[id] = e.nativeEvent.layout.y;
  }, []);

  /** Align section top (title) with top of scroll area beside the sidebar */
  const scrollToSection = useCallback((id) => {
    const y = sectionYs.current[id];
    if (y == null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, y), animated: true });
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
      clearUserProfileCache();
      void getUserProfile({ forceRefresh: true }).catch(() => {});
      setSavedBaseline(
        buildProfileFormSnapshot({
          name,
          phone,
          location,
          linkedin,
          github,
          website,
          preferredPositions,
          preferredLocations,
          workArrangement,
          identification,
        })
      );
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
        const response = await fetch(`${API_BASE_URL}/resume/upload`, {
          method: 'POST',
          body: formDataObj,
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          const message = data?.message || data?.detail || 'Failed to upload resume';
          throw new Error(message);
        }
        
        setResumeFileName(data.data?.file_name || file.name);
        setResumeFileData('');
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

  const handleResumeDownload = () => {
    if (!resumeFileData) {
      setResumeError('No resume file is available to download.');
      return;
    }

    try {
      const binary = atob(resumeFileData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resumeFileName || 'profile_resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setResumeError('');
    } catch (error) {
      setResumeError('Unable to download resume.');
    }
  };

  const handleRemoveResume = async () => {
    if (!resumeFileName || removingResume) {
      return;
    }

    try {
      setRemovingResume(true);
      setResumeError('');
      await apiFetch('/resume/upload', {
        method: 'DELETE',
      });

      setResumeFileName('');
      setResumeFileData('');
      setSaveSuccess('Resume removed successfully.');
    } catch (error) {
      setResumeError(error.message || 'Unable to remove resume.');
    } finally {
      setRemovingResume(false);
    }
  };

  const handlePickAvatar = async () => {
    if (uploadingAvatar || removingAvatar) return;
    setAvatarError('');
    setSaveError('');
    setSaveSuccess('');

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        setAvatarError('Allow photo library access to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploadingAvatar(true);

      const formData = new FormData();
      const fileName = asset.fileName || 'avatar.jpg';
      const mime = asset.mimeType || 'image/jpeg';

      if (Platform.OS === 'web') {
        const resBlob = await fetch(asset.uri);
        const blob = await resBlob.blob();
        formData.append('avatar_file', blob, fileName);
      } else {
        formData.append('avatar_file', {
          uri: asset.uri,
          name: fileName,
          type: mime,
        });
      }

      const postAvatar = (path) =>
        fetch(apiUrl(path), {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

      let response = await postAvatar('/profile/avatar');
      if (response.status === 404) {
        response = await postAvatar('/api/profile/avatar');
      }

      const text = await response.text();
      let body = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }

      if (!response.ok) {
        const msg =
          body.message ||
          (typeof body.detail === 'string' ? body.detail : null) ||
          'Could not upload photo.';
        throw new Error(msg);
      }

      const me = await apiFetch('/profile');
      const responseData = me && me.data ? me.data : {};
      const p = responseData.profile || {};
      if (p.avatar_opt_out) {
        setAvatarImageUri(null);
      } else if (p.avatar_base64 && p.avatar_mime) {
        setAvatarImageUri(`data:${p.avatar_mime};base64,${p.avatar_base64}`);
      } else {
        setAvatarImageUri(p.avatar_url || p.picture || responseData.avatar_url || responseData.picture || null);
      }
      clearUserProfileCache();
      void getUserProfile({ forceRefresh: true }).catch(() => {});
      notifyProfileUpdated();
      setSaveSuccess('Profile photo updated.');
    } catch (err) {
      setAvatarError(err.message || 'Could not update profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarImageUri || removingAvatar || uploadingAvatar) return;
    setAvatarError('');
    setSaveError('');
    setSaveSuccess('');

    try {
      setRemovingAvatar(true);
      const token = getAuthToken();
      const del = (path) =>
        fetch(apiUrl(path), {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      let res = await del('/profile/avatar');
      if (res.status === 404) {
        res = await del('/api/profile/avatar');
      }
      const text = await res.text();
      let body = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
      if (!res.ok) {
        const msg =
          body.message ||
          (typeof body.detail === 'string' ? body.detail : null) ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setAvatarImageUri(null);
      clearUserProfileCache();
      void getUserProfile({ forceRefresh: true }).catch(() => {});
      notifyProfileUpdated();
      setSaveSuccess('Profile photo removed.');
    } catch (err) {
      setAvatarError(err.message || 'Could not remove profile photo.');
    } finally {
      setRemovingAvatar(false);
    }
  };

  const workArrangementOptions = [
    { value: 'any', label: 'Any (Remote, Hybrid, On-Site)' },
    { value: 'remote', label: 'Remote Only' },
    { value: 'onsite', label: 'On Site / Hybrid Only' },
  ];

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

  const handleToggleIdentificationDropdown = (fieldKey) => {
    setOpenIdentificationDropdown((prev) => (prev === fieldKey ? null : fieldKey));
  };

  const handleCloseIdentificationDropdowns = () => {
    setOpenIdentificationDropdown(null);
  };

  const initials = name.trim()
    ? name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const displayName = name.trim() || 'Name not set';

  const renderProfileStatsCard = (railLayout) => (
    <View style={[styles.card, railLayout && styles.metricsCardCompact]}>
      <Text style={styles.cardTitle}>Profile Stats</Text>
      <View style={[styles.statsContainer, railLayout && styles.statsRailColumn]}>
        <View style={[styles.statItem, railLayout && styles.statItemRail]}>
          <Text style={styles.statValue}>23</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
        <View style={railLayout ? styles.statDividerHorizontal : styles.statDivider} />
        <View style={[styles.statItem, railLayout && styles.statItemRail]}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Interviews</Text>
        </View>
        <View style={railLayout ? styles.statDividerHorizontal : styles.statDivider} />
        <View style={[styles.statItem, railLayout && styles.statItemRail]}>
          <Text style={styles.statValue}>87%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>
    </View>
  );

  const renderSaveControls = (variant) => (
    <View style={variant === 'sidebar' ? styles.sidebarSaveBlock : styles.mobileSaveBarInner}>
      <Pressable
        disabled={saving || loadingProfile}
        style={({ pressed }) => [
          styles.saveButton,
          variant === 'sidebar' && styles.saveButtonSidebar,
          variant === 'mobile' && styles.saveButtonMobile,
          pressed && !saving && styles.saveButtonPressed,
          (saving || loadingProfile) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
      >
        <LinearGradient
          colors={['#A78BFA', '#8B7AB8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.saveButtonGradient, variant === 'sidebar' && styles.saveButtonGradientSidebar]}
        >
          <Text style={[styles.saveButtonText, variant === 'sidebar' && styles.saveButtonTextSidebar]}>
            {saving ? 'Saving...' : 'Save changes'}
          </Text>
        </LinearGradient>
      </Pressable>
      {!!saveError && (
        <Text style={[styles.errorText, variant === 'sidebar' && styles.sidebarSaveMessage]}>{saveError}</Text>
      )}
      {!!saveSuccess && (
        <Text style={[styles.successText, variant === 'sidebar' && styles.sidebarSaveMessage]}>{saveSuccess}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient colors={THEME.gradients.page} style={styles.gradient}>
        <View style={isDesktop ? styles.layoutWithSidebar : styles.profileLayoutWithMobileSave}>
          {isDesktop && (
            <View style={styles.profileSidebarSticky} accessibilityRole="navigation">
              <Text style={styles.profileSidebarHeading}>On this page</Text>
              {navSections.map(({ id, label }) => (
                <Pressable
                  key={id}
                  onPress={() => scrollToSection(id)}
                  style={({ pressed }) => [
                    styles.profileNavLink,
                    pressed && styles.profileNavLinkPressed,
                  ]}
                >
                  <Text style={styles.profileNavLinkText}>{label}</Text>
                </Pressable>
              ))}
              {isDesktop && !hasUnsavedChanges && !!saveSuccess ? (
                <View style={styles.sidebarFeedbackOnly}>
                  <Text style={[styles.successText, styles.sidebarSaveMessage]}>{saveSuccess}</Text>
                </View>
              ) : null}
              {hasUnsavedChanges ? renderSaveControls('sidebar') : null}
            </View>
          )}
          {!isDesktop && !hasUnsavedChanges && !!saveSuccess ? (
            <View style={styles.mobileSuccessBanner}>
              <Text style={[styles.successText, styles.mobileSuccessBannerText]}>{saveSuccess}</Text>
            </View>
          ) : null}
          <View style={isDesktop ? styles.desktopMainRow : styles.profileNarrowStack}>
            <ScrollView
              ref={scrollRef}
              style={isDesktop ? styles.mainScroll : styles.scrollView}
              contentContainerStyle={
                isDesktop
                  ? styles.mainScrollContent
                  : hasUnsavedChanges
                    ? styles.scrollContentWithMobileSave
                    : undefined
              }
              showsVerticalScrollIndicator={false}
            >
            <View
              style={
                isDesktop
                  ? styles.scrollInnerWithSidebar
                  : [styles.content, !isWideLayout && { paddingHorizontal: 16, paddingTop: 24 }]
              }
            >
              <View collapsable={false}>
                  <View onLayout={onSectionLayout('overview')}>
                    <View style={styles.headerSection}>
                      <View style={styles.titleContainer}>
                        <View style={styles.heroBadge}>
                          <View style={styles.heroBadgeDot} />
                          <Text style={styles.heroBadgeText}>Account</Text>
                        </View>
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

                    <View style={styles.avatarSection}>
                      <View style={styles.avatarContainer}>
                        <Pressable
                          onPress={handlePickAvatar}
                          disabled={uploadingAvatar || removingAvatar}
                          accessibilityRole="button"
                          accessibilityLabel="Change profile photo"
                        >
                          <View style={styles.avatar}>
                            {avatarImageUri ? (
                              <Image
                                source={{ uri: avatarImageUri }}
                                style={styles.avatarImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text style={styles.avatarText}>{initials}</Text>
                            )}
                          </View>
                        </Pressable>
                      </View>
                      <View style={styles.avatarActionsRow}>
                        <Pressable
                          onPress={handlePickAvatar}
                          disabled={uploadingAvatar || removingAvatar}
                        >
                          <Text
                            style={[
                              styles.avatarActionLink,
                              (uploadingAvatar || removingAvatar) && styles.avatarActionDisabled,
                            ]}
                          >
                            {uploadingAvatar ? 'Uploading…' : 'Change photo'}
                          </Text>
                        </Pressable>
                        {avatarImageUri ? (
                          <Pressable
                            onPress={handleRemoveAvatar}
                            disabled={uploadingAvatar || removingAvatar}
                          >
                            <Text
                              style={[
                                styles.avatarActionLinkMuted,
                                (uploadingAvatar || removingAvatar) && styles.avatarActionDisabled,
                              ]}
                            >
                              {removingAvatar ? 'Removing…' : 'Remove'}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                      {!!avatarError && (
                        <Text style={styles.errorText}>{avatarError}</Text>
                      )}
                      <Text style={styles.avatarName}>{displayName}</Text>
                      <Text style={styles.avatarRole}>{subscriptionTier || 'Subscription not set'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardsContainer}>
                    <View onLayout={onSectionLayout('personal')}>
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
                    </View>

                    <View onLayout={onSectionLayout('preferences')}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Job Preferences</Text>

                <View style={styles.preferenceSection}>
                  <Text style={styles.sectionTitle}>Positions</Text>
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={[styles.input, styles.inputWithButtonField]}
                      placeholder="e.g. Data Analyst"
                      placeholderTextColor="#6B7280"
                      value={positionInput}
                      onChangeText={setPositionInput}
                      onSubmitEditing={handleAddPosition}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.addButton,
                        pressed && styles.addButtonPressed,
                      ]}
                      onPress={handleAddPosition}
                    >
                      <View style={styles.addButtonGlyph}>
                        <Text style={styles.addButtonText}>+</Text>
                      </View>
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
                      style={[styles.input, styles.inputWithButtonField]}
                      placeholder="e.g. New York, NY"
                      placeholderTextColor="#6B7280"
                      value={locationInput}
                      onChangeText={setLocationInput}
                      onSubmitEditing={handleAddLocation}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.addButton,
                        pressed && styles.addButtonPressed,
                      ]}
                      onPress={handleAddLocation}
                    >
                      <View style={styles.addButtonGlyph}>
                        <Text style={styles.addButtonText}>+</Text>
                      </View>
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
                  <View style={styles.radioGroup}>
                    {workArrangementOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        style={styles.radioRow}
                        onPress={() => setWorkArrangement(option.value)}
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            workArrangement === option.value && styles.radioOuterSelected,
                          ]}
                        >
                          {workArrangement === option.value ? (
                            <View style={styles.radioInner} />
                          ) : null}
                        </View>
                        <Text style={styles.radioLabel}>{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
                    </View>

                      <View onLayout={onSectionLayout('identification')} style={styles.identificationSection}>
                    <View style={[styles.card, styles.identificationCard]}>
                <Text style={styles.cardTitle}>Identification</Text>
                  <View style={styles.identificationGrid}>
                    <View style={styles.identificationColumn}>
                      <View style={styles.preferenceSection}>
                        <Text style={styles.sectionTitle}>Sex</Text>
                        <IdentificationSelectField
                          fieldKey="sex"
                          value={identification.sex}
                          onValueChange={(value) => updateIdentification('sex', value)}
                          options={SEX_OPTIONS}
                          placeholder="Select sex"
                          focused={focusedIdentificationField === 'sex'}
                          onFocus={() => setFocusedIdentificationField('sex')}
                          onBlur={() => setFocusedIdentificationField(null)}
                          isOpen={openIdentificationDropdown === 'sex'}
                          onToggleOpen={handleToggleIdentificationDropdown}
                          onClose={handleCloseIdentificationDropdowns}
                        />
                      </View>

                      <View style={styles.preferenceSection}>
                        <Text style={styles.sectionTitle}>Gender</Text>
                        <IdentificationSelectField
                          fieldKey="gender"
                          value={identification.gender}
                          onValueChange={(value) => updateIdentification('gender', value)}
                          options={GENDER_OPTIONS}
                          placeholder="Select gender"
                          focused={focusedIdentificationField === 'gender'}
                          onFocus={() => setFocusedIdentificationField('gender')}
                          onBlur={() => setFocusedIdentificationField(null)}
                          isOpen={openIdentificationDropdown === 'gender'}
                          onToggleOpen={handleToggleIdentificationDropdown}
                          onClose={handleCloseIdentificationDropdowns}
                        />
                      </View>
                    </View>

                    <View style={styles.identificationColumn}>
                      <View style={styles.preferenceSection}>
                        <Text style={styles.sectionTitle}>Disability</Text>
                        <IdentificationSelectField
                          fieldKey="disability"
                          value={identification.disability}
                          onValueChange={(value) => updateIdentification('disability', value)}
                          options={DISABILITY_OPTIONS}
                          placeholder="Select disability"
                          focused={focusedIdentificationField === 'disability'}
                          onFocus={() => setFocusedIdentificationField('disability')}
                          onBlur={() => setFocusedIdentificationField(null)}
                          isOpen={openIdentificationDropdown === 'disability'}
                          onToggleOpen={handleToggleIdentificationDropdown}
                          onClose={handleCloseIdentificationDropdowns}
                        />
                      </View>

                      <View style={styles.preferenceSection}>
                        <Text style={styles.sectionTitle}>Race / ethnicity</Text>
                        <IdentificationSelectField
                          fieldKey="race"
                          value={identification.race}
                          onValueChange={(value) => updateIdentification('race', value)}
                          options={RACE_ETHNICITY_OPTIONS}
                          placeholder="Select race/ethnicity"
                          focused={focusedIdentificationField === 'race'}
                          onFocus={() => setFocusedIdentificationField('race')}
                          onBlur={() => setFocusedIdentificationField(null)}
                          isOpen={openIdentificationDropdown === 'race'}
                          onToggleOpen={handleToggleIdentificationDropdown}
                          onClose={handleCloseIdentificationDropdowns}
                        />
                      </View>
                    </View>
                  </View>
              </View>
                    </View>

                    <View onLayout={onSectionLayout('resume')}>
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

                {resumeFileName && (
                  <View style={styles.resumeActionRow}>
                    <Pressable style={styles.resumeActionButton} onPress={handleResumeDownload}>
                      <Text style={styles.resumeActionButtonText}>Download Resume</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.resumeActionButton, styles.resumeRemoveButton, removingResume && styles.uploadButtonDisabled]}
                      onPress={handleRemoveResume}
                      disabled={removingResume}
                    >
                      <Text style={styles.resumeActionButtonText}>
                        {removingResume ? 'Removing...' : 'Remove Resume'}
                      </Text>
                    </Pressable>
                  </View>
                )}
                
                {!!resumeError && <Text style={styles.errorText}>{resumeError}</Text>}
              </View>
                    </View>

                    {!isDesktop ? (
                      <View onLayout={onSectionLayout('stats')}>{renderProfileStatsCard(false)}</View>
                    ) : null}
                  </View>
              </View>
            </View>
            </ScrollView>
            {isDesktop ? (
              <View style={styles.metricsRail}>
                <View style={styles.metricsRailSticky}>{renderProfileStatsCard(true)}</View>
              </View>
            ) : null}
            {!isDesktop && hasUnsavedChanges ? (
              <View style={styles.mobileSaveBar}>{renderSaveControls('mobile')}</View>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
