import { StyleSheet, Platform } from 'react-native';
import { THEME } from '../styles/theme';

const { colors: COLORS } = THEME;

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A1F',
  },
  scrollContent: {
    flex: 1,
  },
  pageBackground: {
    ...(isWeb ? { minHeight: '100vh' } : {}),
    paddingBottom: 80,
  },
  pageContent: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 60,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 56,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backArrow: {
    color: COLORS.textPrimary,
    fontSize: 22,
    lineHeight: 26,
  },
  pageTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.white,
    fontSize: isWeb ? 38 : 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 44,
  },
  cardsWrapper: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: isWeb ? 20 : 20,
    // flex-end = bottom-aligned; taller cards rise higher → natural staircase
    alignItems: isWeb ? 'flex-end' : 'stretch',
    justifyContent: 'center',
    marginBottom: 52,
  },
  planCard: {
    // All cards same base width; heights differ via minHeight on the gradient
    ...(isWeb ? { width: 300 } : {}),
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    // borderColor is set inline per-plan from the component
    borderColor: 'rgba(120, 120, 160, 0.35)',
    ...(isWeb ? {
      cursor: 'pointer',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    } : {}),
  },
  planCardHovered: {
    ...(isWeb ? {
      transform: [{ translateY: -6 }],
    } : {}),
  },
  planCardGradient: {
    padding: 28,
    flex: 1,
  },
  planName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  planNameFeatured: {
    fontSize: 28,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 4,
  },
  planPrice: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
  },
  planPriceFeatured: {
    fontSize: 44,
    lineHeight: 50,
  },
  planPeriod: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 6,
  },
  yearlyNote: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
    marginVertical: 20,
  },
  featuresList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    flexShrink: 0,
  },
  featureText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  subFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 20,
    marginTop: 4,
  },
  subBulletIndent: {
    fontSize: 14,
    flexShrink: 0,
  },
  subFeatureText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  badgeContainer: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.2)',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  continueWrapper: {
    alignItems: 'center',
  },
  continueButton: {
    borderRadius: 50,
    overflow: 'hidden',
    ...(isWeb ? {
      cursor: 'pointer',
    } : {}),
  },
  continueButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  continueArrow: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default styles;
