import { StyleSheet, Platform, Dimensions } from 'react-native';
import { THEME } from '../../src/styles/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const { colors: COLORS } = THEME;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
    paddingTop: 48,
    paddingBottom: 56,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 34,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 28,
    paddingVertical: isDesktop ? 62 : 48,
    paddingHorizontal: isDesktop ? 36 : 22,
    backgroundColor: 'rgba(18, 18, 26, 0.82)',
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 56px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(20px)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 15,
      },
    }),
  },
  heroBackgroundCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(139, 122, 184, 0.16)',
    top: -80,
    left: -70,
  },
  heroBackgroundCircle2: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    bottom: -110,
    right: -90,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 800,
    zIndex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    marginBottom: 24,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  heroTitle: {
    fontSize: isDesktop ? 58 : isTablet ? 46 : 34,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  heroSubtitle: {
    fontSize: isDesktop ? 19 : 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: isDesktop ? 30 : 26,
    maxWidth: 700,
    opacity: 0.9,
  },
  // Instructions Card
  instructionsCard: {
    width: '100%',
    maxWidth: 800,
    backgroundColor: 'rgba(18, 18, 26, 0.88)',
    borderRadius: 22,
    padding: isDesktop ? 48 : isTablet ? 40 : 32,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 14px 40px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(16px)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 12,
      },
    }),
  },
  instructionsList: {
    width: '100%',
    marginBottom: 30,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  instructionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(167, 139, 250, 0.4)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  instructionNumberText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: isDesktop ? 17 : 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 34,
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(167, 139, 250, 0.25)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  continueButtonHover: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(167, 139, 250, 0.6)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  continueButtonArrow: {
    width: 18,
    height: 18,
    position: 'relative',
  },
  arrowLine: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: 12,
    height: 2,
    backgroundColor: COLORS.white,
  },
  arrowHead: {
    position: 'absolute',
    top: 5,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: COLORS.white,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightWidth: 0,
  },
});

export default styles;

