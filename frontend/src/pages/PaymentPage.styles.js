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
    maxWidth: 1000,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 60,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
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
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  pageTitleLarge: {
    fontSize: 32,
  },
  headerSpacer: {
    width: 44,
  },
  mainLayout: {
    gap: 32,
  },
  mainLayoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainLayoutNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  planSummaryCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    // borderColor and boxShadow set inline from plan config
    borderColor: 'transparent',
  },
  planSummaryCardWide: {
    width: 320,
    maxWidth: '100%',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  planSummaryGradient: {
    padding: 28,
  },
  planSummaryHeader: {
    marginBottom: 16,
  },
  planSummaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  planSummaryName: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
  },
  freePlanCurrentLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  freePlanBody: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  freePlanCta: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.45)',
  },
  freePlanCtaText: {
    color: '#A78BFA',
    fontSize: 15,
    fontWeight: '600',
  },
  planSummaryPricing: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 4,
  },
  planSummaryPrice: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 48,
  },
  planSummaryPeriod: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginBottom: 6,
  },
  planSummaryYearly: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 4,
  },
  planDivider: {
    height: 1,
    // backgroundColor set inline from plan config
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  planSummaryFeaturesTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  planSummaryFeatureRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  planSummaryFeatureCheck: {
    // color set inline from plan config
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  planSummaryFeatureText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  planSummaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    // borderTopColor set inline from plan config
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  totalAmount: {
    // color set inline from plan config
    fontSize: 20,
    fontWeight: '700',
  },
  paymentForm: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 32,
  },
  formSectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  paymentMethodTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  methodTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  methodTabActive: {
    borderColor: 'rgba(167, 139, 250, 0.6)',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  methodTabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  methodTabTextActive: {
    color: COLORS.white,
  },
  cardForm: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: COLORS.white,
    fontSize: 15,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  inputHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    marginTop: 2,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardRowHalf: {
    flex: 1,
  },
  paypalSection: {
    marginBottom: 4,
  },
  paypalBox: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
  },
  paypalIcon: {
    fontSize: 28,
  },
  paypalText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  securityIcon: {
    fontSize: 14,
  },
  securityText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    flex: 1,
  },
  purchaseButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default styles;
