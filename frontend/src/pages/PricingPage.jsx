import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from './PricingPage.styles';
import { PLAN_CONFIG } from '../config/planConfig';

// Page-specific feature lists merged with shared colour/theme config
const PLANS = [
  {
    ...PLAN_CONFIG.free,
    id: 'free',
    features: [
      { text: 'Manual job search across postings' },
      { text: 'Manual job application' },
      { text: 'Basic surface level resume scan' },
      { text: 'Simple cover letter templates' },
      { text: 'Basic interview question set' },
      { text: 'Limited AI Generated resumes and cover letters' },
    ],
    badge: null,
  },
  {
    ...PLAN_CONFIG.premium,
    id: 'premium',
    features: [
      { text: 'Full-Time Optimization' },
      { text: 'Tailored Rewrites for each job posting' },
      { text: 'Unlimited AI - Generated cover letters and cover letters' },
      { text: 'Full interview prep suite' },
      { text: 'Full job tracker + analytics' },
      {
        text: 'AI Apply Assistant',
        subItems: [
          'Find relevant roles',
          'Pre-fill Application details',
          'Generates tailored resumes + coverletters',
        ],
      },
    ],
    badge: 'Daily limit: 10 AI-assisted applications',
  },
  {
    ...PLAN_CONFIG.pro,
    id: 'pro',
    features: [
      {
        text: 'Auto-Apply AI Agent',
        subItems: [
          'Automatically completes applications',
          'Multi-role targeting',
          'Priority Processing',
        ],
      },
      { text: 'Weekly coaching prompts' },
      { text: 'Personalized career progress reports' },
      { text: 'Advanced job scoring \u2013 ranking' },
    ],
    badge: 'Daily limit: 25-40 Auto-applications',
  },
];

const PlanCard = ({ plan, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  const cardBorder = selected
    ? plan.selectedBorderColor
    : hovered
    ? plan.accentColor.replace(')', ', 0.6)').replace('rgba', 'rgba').replace('rgb(', 'rgba(')
    : plan.borderColor;

  const cardShadow = Platform.OS === 'web'
    ? selected || hovered
      ? `0 0 0 2px ${plan.accentColor}40, 0 16px 48px ${plan.glowColor}`
      : `0 8px 32px ${plan.glowColor}`
    : {};

  return (
    <Pressable
      onPress={() => onSelect(plan.id)}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        styles.planCard,
        { borderColor: cardBorder },
        Platform.OS === 'web' && { boxShadow: cardShadow },
        hovered && styles.planCardHovered,
      ]}
    >
      <LinearGradient
        colors={plan.gradientColors}
        style={[
          styles.planCardGradient,
          // Staircase: enforce minimum height per plan (web only)
          Platform.OS === 'web' && { minHeight: plan.stairHeight },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.planName, plan.featured && styles.planNameFeatured]}>
          {plan.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.planPrice, plan.featured && styles.planPriceFeatured]}>
            {plan.price}
          </Text>
          <Text style={styles.planPeriod}>{plan.period}</Text>
        </View>

        {plan.yearlyNote && (
          <Text style={styles.yearlyNote}>{plan.yearlyNote}</Text>
        )}

        <View style={[styles.divider, { backgroundColor: plan.dividerColor }]} />

        <View style={styles.featuresList}>
          {plan.features.map((feature, index) => (
            <View key={index}>
              <View style={styles.featureRow}>
                <Text style={[styles.bulletDot, { color: plan.accentColor }]}>•</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
              {feature.subItems && feature.subItems.map((sub, si) => (
                <View key={si} style={styles.subFeatureRow}>
                  <Text style={styles.subBulletIndent}>{'   '}</Text>
                  <Text style={styles.subFeatureText}>{sub}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {plan.badge && (
          <View style={[styles.badgeContainer, { borderTopColor: plan.dividerColor }]}>
            <Text style={[styles.badgeText, { color: plan.accentColor }]}>• {plan.badge}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const PricingPage = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('premium');

  const handleContinue = () => {
    if (selectedPlan === 'free') {
      router.push({ pathname: '/payment-success', params: { plan: 'free' } });
    } else {
      router.push({ pathname: '/payment', params: { plan: selectedPlan } });
    }
  };

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
            <View style={styles.pageHeader}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </Pressable>
              <Text style={styles.pageTitle}>Choose Your Plan</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.cardsWrapper}>
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan === plan.id}
                  onSelect={setSelectedPlan}
                />
              ))}
            </View>

            <View style={styles.continueWrapper}>
              <Pressable onPress={handleContinue} style={styles.continueButton}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueButtonGradient}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Text style={styles.continueArrow}> →</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

export default PricingPage;
