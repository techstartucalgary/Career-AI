import { StyleSheet, Platform } from 'react-native';
import { THEME } from '../styles/theme';

const { colors: COLORS } = THEME;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A1F',
  },
  scrollContent: {
    flex: 1,
  },
  pageBackground: {
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
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
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  pageTitleLarge: {
    fontSize: 38,
  },
  headerSpacer: {
    width: 44,
  },
  cardsWrapper: {
    gap: 20,
    justifyContent: 'center',
    marginBottom: 52,
  },
  cardsWrapperWide: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cardsWrapperNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  planCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 160, 0.35)',
    width: '100%',
    alignSelf: 'stretch',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }
      : {}),
  },
  planCardWide: {
    width: 300,
    maxWidth: '100%',
    alignSelf: 'flex-end',
  },
  planCardHovered: {
    ...(Platform.OS === 'web'
      ? {
          transform: [{ translateY: -6 }],
        }
      : {}),
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
  currentPlanLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: -4,
  },
  planCardStatic: {
    ...(Platform.OS === 'web'
      ? {
          cursor: 'default',
        }
      : {}),
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
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  continueButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default styles;
