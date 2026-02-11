import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import Header from '../src/components/Header';
import { THEME } from '../src/styles/theme';
import OnboardingStep1 from '../src/pages/onboarding/OnboardingStep1';
import OnboardingStep2 from '../src/pages/onboarding/OnboardingStep2';
import OnboardingStep3 from '../src/pages/onboarding/OnboardingStep3';
import OnboardingStep4 from '../src/pages/onboarding/OnboardingStep4';
import styles from './OnboardingPage.styles';
import { apiFetch, getAuthToken } from '../src/services/api';

const OnboardingPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // step 1 is Resume Upload
  const [formData, setFormData] = useState({
    // User email from sign-up
    email: params.email || '',
    // Step 1 (Resume) data
    resume: null,
    resumeFileName: '',
    extractedData: null, // Data extracted from resume
    // Step 2 (Profile) data - will be auto-filled from resume
    firstName: '',
    lastName: '',
    cellPhone: '',
    linkedinUrl: '',
    githubUrl: '',
    website: '',
    location: '',
    // Step 3 (Preferences) data
    positions: [],
    locations: [],
    workArrangement: 'any',
    // Step 4 (Demographics) data
    sex: '',
    gender: '',
    disability: '',
    race: '',
  });

  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
    setIsAuthChecking(false);
  }, []);

  if (isAuthChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/authentication" />;
  }

  const handleNext = async (stepData) => {
    const nextData = { ...formData, ...stepData };
    setFormData(nextData);

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Only call API when completing final step (step 4)
    try {
      // Complete onboarding with profile and preferences
      await apiFetch('/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({
          first_name: nextData.firstName,
          last_name: nextData.lastName,
          phone: nextData.cellPhone,
          linkedin: nextData.linkedinUrl,
          github: nextData.githubUrl,
          website: nextData.website,
          location: nextData.location,
          positions: nextData.positions,
          locations: nextData.locations,
          work_arrangement: nextData.workArrangement,
        }),
      });

      // Update demographics separately if any were provided
      const demographics = {
        sex: nextData.sex || null,
        gender: nextData.gender || null,
        disability: nextData.disability || null,
        race: nextData.race || null,
      };

      // Only call demographics endpoint if at least one field is provided
      const hasDemographics = Object.values(demographics).some(val => val);
      if (hasDemographics) {
        await apiFetch('/demographics', {
          method: 'PUT',
          body: JSON.stringify(demographics),
        });
      }

      router.push('/jobs');
    } catch (error) {
      alert(error.message || 'Unable to complete onboarding.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/authentication');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Resume Upload
        return <OnboardingStep2 formData={formData} onNext={handleNext} onBack={handleBack} />;
      case 2:
        // Step 2: Complete Profile (auto-filled from resume)
        return <OnboardingStep1 formData={formData} onNext={handleNext} onBack={handleBack} />;
      case 3:
        // Step 3: Job Preferences
        return <OnboardingStep3 formData={formData} onNext={handleNext} onBack={handleBack} />;
      case 4:
        // Step 4: Demographics (optional)
        return <OnboardingStep4 formData={formData} onNext={handleNext} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient
        colors={THEME.gradients.page}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Step Indicators */}
            <View style={styles.stepIndicators}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.stepIndicator,
                    currentStep === step && styles.stepIndicatorActive,
                    currentStep > step && styles.stepIndicatorCompleted
                  ]}
                />
              ))}
            </View>

            {/* Step Content */}
            {renderStep()}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default OnboardingPage;

