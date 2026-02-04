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
    paddingTop: 40,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    paddingVertical: 60,
    backgroundColor: 'rgba(18, 18, 26, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    top: -50,
    left: -50,
  },
  heroBackgroundCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    bottom: -80,
    right: -80,
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
    fontSize: isDesktop ? 64 : isTablet ? 52 : 40,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  heroSubtitle: {
    fontSize: isDesktop ? 22 : 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: isDesktop ? 32 : 28,
    maxWidth: 700,
    opacity: 0.9,
  },
  // Options Grid
  optionsGrid: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 32,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  optionCard: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  optionCardHover: {
    transform: [{ translateY: -8 }, { scale: 1.02 }],
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(167, 139, 250, 0.25)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 15,
      },
    }),
  },
  optionIconContainer: {
    width: 80,
    height: 80,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconDocument: {
    width: 40,
    height: 50,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: COLORS.primary,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  iconQuestionMark: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 16,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: 'transparent',
  },
  iconVideo: {
    width: 50,
    height: 36,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: COLORS.primary,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  iconPlayButton: {
    position: 'absolute',
    top: 10,
    left: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightWidth: 0,
  },
  optionTitle: {
    fontSize: isDesktop ? 28 : isTablet ? 24 : 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
  },
  optionDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.9,
  },
  // Note: optionButton styles were unused in the JSX; removed to keep styles lean.
});

export default styles;

