import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from './PaymentPage.styles';
import { PLAN_CONFIG } from '../config/planConfig';
import { useBreakpoints } from '../hooks/useBreakpoints';

const InputField = ({ label, placeholder, value, onChangeText, keyboardType, maxLength, hint }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.25)"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType || 'default'}
      maxLength={maxLength}
    />
    {hint && <Text style={styles.inputHint}>{hint}</Text>}
  </View>
);

const formatCardNumber = (text) => {
  const digits = text.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (text) => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
};

const PaymentPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isWideLayout } = useBreakpoints();
  const rawPlan = params?.plan;
  const planId = (Array.isArray(rawPlan) ? rawPlan[0] : rawPlan) || 'premium';
  const plan = PLAN_CONFIG[planId] || PLAN_CONFIG.premium;
  const isFreePlan = planId === 'free';

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeMethod, setActiveMethod] = useState('card');

  const handlePurchase = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      router.push({ pathname: '/payment-success', params: { plan: planId } });
    }, 1800);
  };

  const isFormValid = cardName.trim() && cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length >= 3;

  if (isFreePlan) {
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
                <Text style={[styles.pageTitle, isWideLayout && styles.pageTitleLarge]}>
                  Your plan
                </Text>
                <View style={styles.headerSpacer} />
              </View>

              <View
                style={[
                  styles.planSummaryCard,
                  { borderColor: plan.borderColor },
                  Platform.OS === 'web' && {
                    boxShadow: `0 8px 32px ${plan.glowColor}`,
                  },
                ]}
              >
                <LinearGradient
                  colors={plan.gradientColors}
                  style={styles.planSummaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.planSummaryHeader}>
                    <Text style={styles.planSummaryLabel}>You are on</Text>
                    <Text style={styles.planSummaryName}>{plan.name}</Text>
                    <Text style={styles.freePlanCurrentLabel}>(Current plan)</Text>
                  </View>
                  <Text style={styles.freePlanBody}>
                    There is no paid checkout for the free tier. Upgrade from the pricing page when you are ready for Premium or Pro.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/pricing')}
                    style={styles.freePlanCta}
                  >
                    <Text style={styles.freePlanCtaText}>View paid plans</Text>
                  </Pressable>
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </View>
    );
  }

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
              <Text style={[styles.pageTitle, isWideLayout && styles.pageTitleLarge]}>
                Complete Your Purchase
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={[styles.mainLayout, isWideLayout ? styles.mainLayoutWide : styles.mainLayoutNarrow]}>
              {/* Plan Summary — colours sourced from shared planConfig */}
              <View style={[
                styles.planSummaryCard,
                isWideLayout && styles.planSummaryCardWide,
                { borderColor: plan.borderColor },
                Platform.OS === 'web' && {
                  boxShadow: `0 8px 32px ${plan.glowColor}`,
                },
              ]}>
                <LinearGradient
                  colors={plan.gradientColors}
                  style={styles.planSummaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.planSummaryHeader}>
                    <Text style={styles.planSummaryLabel}>You selected</Text>
                    <Text style={styles.planSummaryName}>{plan.name}</Text>
                  </View>

                  <View style={styles.planSummaryPricing}>
                    <Text style={styles.planSummaryPrice}>{plan.price}</Text>
                    <Text style={styles.planSummaryPeriod}>{plan.period}</Text>
                  </View>
                  {plan.yearlyPrice && (
                    <Text style={styles.planSummaryYearly}>or {plan.yearlyPrice} billed annually</Text>
                  )}

                  <View style={[styles.planDivider, { backgroundColor: plan.dividerColor }]} />

                  <Text style={styles.planSummaryFeaturesTitle}>What's included:</Text>
                  {plan.summaryFeatures.map((f, i) => (
                    <View key={i} style={styles.planSummaryFeatureRow}>
                      <Text style={[styles.planSummaryFeatureCheck, { color: plan.accentColor }]}>✓</Text>
                      <Text style={styles.planSummaryFeatureText}>{f}</Text>
                    </View>
                  ))}

                  <View style={[styles.planSummaryTotal, { borderTopColor: plan.dividerColor }]}>
                    <Text style={styles.totalLabel}>Today's charge</Text>
                    <Text style={[styles.totalAmount, { color: plan.accentColor }]}>{plan.price}</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Payment Form */}
              <View style={styles.paymentForm}>
                <Text style={styles.formSectionTitle}>Payment Method</Text>

                <View style={styles.paymentMethodTabs}>
                  <Pressable
                    onPress={() => setActiveMethod('card')}
                    style={[styles.methodTab, activeMethod === 'card' && styles.methodTabActive]}
                  >
                    <Text style={[styles.methodTabText, activeMethod === 'card' && styles.methodTabTextActive]}>
                      💳 Card
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setActiveMethod('paypal')}
                    style={[styles.methodTab, activeMethod === 'paypal' && styles.methodTabActive]}
                  >
                    <Text style={[styles.methodTabText, activeMethod === 'paypal' && styles.methodTabTextActive]}>
                      PayPal
                    </Text>
                  </Pressable>
                </View>

                {activeMethod === 'card' ? (
                  <View style={styles.cardForm}>
                    <InputField
                      label="Cardholder Name"
                      placeholder="Full name on card"
                      value={cardName}
                      onChangeText={setCardName}
                    />
                    <InputField
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                      keyboardType="numeric"
                      hint="We accept Visa, Mastercard, and Amex"
                    />
                    <View style={styles.cardRow}>
                      <View style={styles.cardRowHalf}>
                        <InputField
                          label="Expiry Date"
                          placeholder="MM/YY"
                          value={expiry}
                          onChangeText={(t) => setExpiry(formatExpiry(t))}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                      <View style={styles.cardRowHalf}>
                        <InputField
                          label="CVV"
                          placeholder="123"
                          value={cvv}
                          onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                          keyboardType="numeric"
                          maxLength={4}
                        />
                      </View>
                    </View>
                    <InputField
                      label="Billing ZIP / Postal Code"
                      placeholder="12345"
                      value={billingZip}
                      onChangeText={setBillingZip}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                ) : (
                  <View style={styles.paypalSection}>
                    <View style={styles.paypalBox}>
                      <Text style={styles.paypalIcon}>🔵</Text>
                      <Text style={styles.paypalText}>
                        You'll be redirected to PayPal to complete your purchase securely.
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.securityNote}>
                  <Text style={styles.securityIcon}>🔒</Text>
                  <Text style={styles.securityText}>
                    Your payment is encrypted and secure. Cancel anytime.
                  </Text>
                </View>

                <Pressable
                  onPress={handlePurchase}
                  style={[
                    styles.purchaseButton,
                    (!isFormValid && activeMethod === 'card') && styles.purchaseButtonDisabled,
                  ]}
                  disabled={activeMethod === 'card' && !isFormValid}
                >
                  <LinearGradient
                    colors={
                      (activeMethod === 'card' && !isFormValid)
                        ? plan.gradientColors
                        : [plan.accentColor, plan.gradientColors[0]]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.purchaseButtonGradient}
                  >
                    {processing ? (
                      <Text style={styles.purchaseButtonText}>Processing...</Text>
                    ) : (
                      <>
                        <Text style={styles.purchaseButtonText}>
                          Subscribe to {plan.name} — {plan.price}/mo
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                <Text style={styles.termsText}>
                  By subscribing, you agree to our Terms of Service and Privacy Policy.
                  You can cancel your subscription at any time from your account settings.
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

export default PaymentPage;
