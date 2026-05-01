import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import Header from '../components/Header';
import { THEME } from '../styles/theme';
import OnboardingStep1 from './onboarding/OnboardingStep1';
import OnboardingStep2 from './onboarding/OnboardingStep2';
import OnboardingStep3 from './onboarding/OnboardingStep3';
import OnboardingStep4 from './onboarding/OnboardingStep4';
import { apiFetch, getAuthToken } from '../services/api';
import { StyleSheet } from 'react-native';

const { colors: COLORS } = THEME;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  content: {
    padding: Platform.OS === 'web' ? 40 : 24,
    paddingTop: 100,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  stepIndicator: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    backgroundColor: 'transparent',
  },
  stepIndicatorActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      web: { boxShadow: '0 0 8px rgba(167, 139, 250, 0.6)' },
      default: {},
    }),
  },
  stepIndicatorCompleted: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
});

const OnboardingPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: params.email || '',
    resume: null,
    resumeFileName: '',
    extractedData: null,
    firstName: '',
    lastName: '',
    cellPhone: '',
    linkedinUrl: '',
    githubUrl: '',
    website: '',
    location: '',
    positions: [],
    locations: [],
    workArrangement: 'any',
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

      const demographics = {
        sex: nextData.sex || null,
        gender: nextData.gender || null,
        disability: nextData.disability || null,
        race: nextData.race || null,
      };

      const hasDemographics = Object.values(demographics).some(val => val);
      if (hasDemographics) {
        await apiFetch('/demographics', {
          method: 'PUT',
          body: JSON.stringify(demographics),
        });
      }

      router.replace('/jobs');
    } catch (error) {
      alert(error.message || 'Unable to complete onboarding.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.replace('/authentication');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingStep2 formData={formData} onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <OnboardingStep1 formData={formData} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <OnboardingStep3 formData={formData} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <OnboardingStep4 formData={formData} onNext={handleNext} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient colors={THEME.gradients.page} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.stepIndicators}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.stepIndicator,
                    currentStep === step && styles.stepIndicatorActive,
                    currentStep > step && styles.stepIndicatorCompleted,
                  ]}
                />
              ))}
            </View>
            {renderStep()}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default OnboardingPage;
