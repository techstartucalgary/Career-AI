import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../src/components/Header';
import OnboardingStep1 from '../src/pages/onboarding/OnboardingStep1';
import OnboardingStep2 from '../src/pages/onboarding/OnboardingStep2';
import OnboardingStep3 from '../src/pages/onboarding/OnboardingStep3';
import styles from './OnboardingPage.styles';
import { apiFetch } from '../src/services/api';

const OnboardingPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
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
  });

  const handleNext = async (stepData) => {
    const nextData = { ...formData, ...stepData };
    setFormData(nextData);
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    try {
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

      router.push('/home');
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
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient
        colors={['#1F1C2F', '#2D1B3D', '#1F1C2F']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Step Indicators */}
            <View style={styles.stepIndicators}>
              {[1, 2, 3].map((step) => (
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

