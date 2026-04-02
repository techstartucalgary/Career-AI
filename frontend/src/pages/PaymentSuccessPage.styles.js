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
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageContent: {
    maxWidth: 560,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 60,
    alignItems: 'center',
  },
  successCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    ...(isWeb ? {
      boxShadow: '0 24px 80px rgba(139, 92, 246, 0.3)',
    } : {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 40,
      elevation: 16,
    }),
  },
  successCardGradient: {
    padding: isWeb ? 52 : 36,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    top: -60,
    left: '50%',
    ...(isWeb ? { marginLeft: -120 } : {}),
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    ...(isWeb ? {
      filter: 'blur(40px)',
    } : {}),
  },
  checkmarkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: 28,
    ...(isWeb ? {
      boxShadow: '0 8px 32px rgba(139, 92, 246, 0.5)',
    } : {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
    }),
  },
  checkmarkGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 46,
  },
  planBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    marginBottom: 16,
  },
  planBadgeText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tagline: {
    color: COLORS.white,
    fontSize: isWeb ? 32 : 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  perksList: {
    width: '100%',
    gap: 12,
    marginBottom: 8,
  },
  perkRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  perkCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  perkCheckText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  perkText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    width: '100%',
    marginVertical: 28,
  },
  ctaButton: {
    borderRadius: 50,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 16,
  },
  ctaButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  cancelNote: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default styles;
