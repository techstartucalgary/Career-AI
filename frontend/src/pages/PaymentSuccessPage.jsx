import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Platform, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import ForwardArrowIcon from '../components/ForwardArrowIcon';
import styles from './PaymentSuccessPage.styles';
import { useBreakpoints } from '../hooks/useBreakpoints';

const PLAN_INFO = {
  free: {
    name: 'Free Plan',
    tagline: "You're all set!",
    subtitle: "Your account is ready to go. Start exploring jobs and get your career moving.",
    perks: [
      'Search jobs across thousands of postings',
      'Generate your first AI resume',
      'Try a basic interview prep session',
    ],
  },
  premium: {
    name: 'Premium',
    tagline: "Welcome to Premium!",
    subtitle: "Unlimited AI tools, tailored job applications, and a full interview prep suite — all yours.",
    perks: [
      'Unlimited AI-generated resumes & cover letters',
      'Full interview prep suite unlocked',
      'AI Apply Assistant — up to 10 assisted apps/day',
      'Full job tracker & analytics dashboard',
    ],
  },
  pro: {
    name: 'Pro',
    tagline: "You're on Pro!",
    subtitle: "The most powerful career AI available. Let the auto-apply agent work while you focus on what matters.",
    perks: [
      'Auto-Apply AI Agent — 25-40 applications/day',
      'Multi-role targeting with priority processing',
      'Weekly personalized coaching prompts',
      'Advanced job scoring & career progress reports',
    ],
  },
};

const CheckmarkCircle = ({ scale, opacity }) => (
  <Animated.View style={[styles.checkmarkCircle, { transform: [{ scale }], opacity }]}>
    <LinearGradient
      colors={['#8B5CF6', '#7C3AED']}
      style={styles.checkmarkGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.checkmarkText}>✓</Text>
    </LinearGradient>
  </Animated.View>
);

const PaymentSuccessPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isWideLayout } = useBreakpoints();
  const planId = params?.plan || 'premium';
  const plan = PLAN_INFO[planId] || PLAN_INFO.premium;

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0D0A1F', '#1A1035', '#130E28']}
          style={styles.pageBackground}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <View style={styles.pageContent}>
            <View style={styles.successCard}>
              <LinearGradient
                colors={['#261A52', '#1C1340']}
                style={[styles.successCardGradient, !isWideLayout && { paddingVertical: 36, paddingHorizontal: 24 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.glowRing} />

                <CheckmarkCircle scale={scale} opacity={opacity} />

                <Animated.View style={{
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                }}>
                  {planId !== 'free' && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.name}</Text>
                    </View>
                  )}

                  <Text style={[styles.tagline, !isWideLayout && { fontSize: 24, lineHeight: 30 }]}>
                    {plan.tagline}
                  </Text>
                  <Text style={styles.subtitle}>{plan.subtitle}</Text>

                  <View style={styles.perksList}>
                    {plan.perks.map((perk, i) => (
                      <View key={i} style={styles.perkRow}>
                        <View style={styles.perkCheck}>
                          <Text style={styles.perkCheckText}>✓</Text>
                        </View>
                        <Text style={styles.perkText}>{perk}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  <Pressable
                    onPress={() => router.replace('/jobs')}
                    style={styles.ctaButton}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaButtonGradient}
                    >
                      <Text style={styles.ctaButtonText}>Start using Verexa</Text>
                      <ForwardArrowIcon color="#FFFFFF" size={16} />
                    </LinearGradient>
                  </Pressable>

                  {planId !== 'free' && (
                    <Text style={styles.cancelNote}>
                      You can manage or cancel your subscription anytime from your account settings.
                    </Text>
                  )}
                </Animated.View>
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

export default PaymentSuccessPage;
