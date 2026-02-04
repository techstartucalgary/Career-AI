import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../src/components/Header';
import { THEME } from '../src/styles/theme';
import OnboardingStep1 from '../src/pages/onboarding/OnboardingStep1';
import OnboardingStep2 from '../src/pages/onboarding/OnboardingStep2';
import OnboardingStep3 from '../src/pages/onboarding/OnboardingStep3';
import styles from './OnboardingPage.styles';

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
    location: '',
    // Step 3 (Preferences) data
    positions: [],
    locations: [],
    workArrangement: 'any',
  });

  const handleNext = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete, navigate to Job Board
      router.push('/jobs');
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
        colors={THEME.gradients.page}
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

