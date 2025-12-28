import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const BRIGHT_PURPLE = '#A78BFA';
const WHITE = '#ffffff';
const TEXT_LIGHT = '#D1D5DB';
const GRAY_BACKGROUND = '#2D1B3D';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_PURPLE,
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
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    paddingVertical: 50,
    backgroundColor: 'rgba(45, 27, 61, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(139, 122, 184, 0.3)',
    width: '100%',
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
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    top: -40,
    left: -40,
  },
  heroBackgroundCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    bottom: -60,
    right: -60,
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
    backgroundColor: BRIGHT_PURPLE,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRIGHT_PURPLE,
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  heroTitle: {
    fontSize: isDesktop ? 56 : isTablet ? 48 : 36,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
    textShadowColor: 'rgba(167, 139, 250, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  heroSubtitle: {
    fontSize: isDesktop ? 20 : 18,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: isDesktop ? 30 : 26,
    maxWidth: 700,
    opacity: 0.9,
  },
  // Instructions Card
  instructionsCard: {
    width: '100%',
    maxWidth: 800,
    backgroundColor: 'rgba(45, 27, 61, 0.8)',
    borderRadius: 24,
    padding: isDesktop ? 48 : isTablet ? 40 : 32,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 122, 184, 0.4)',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
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
    marginBottom: 40,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(139, 122, 184, 0.2)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 122, 184, 0.3)',
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
    backgroundColor: BRIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(167, 139, 250, 0.4)',
      },
      default: {
        shadowColor: BRIGHT_PURPLE,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  instructionNumberText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: isDesktop ? 18 : 16,
    color: TEXT_LIGHT,
    lineHeight: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(139, 122, 184, 0.4)',
      },
      default: {
        shadowColor: LIGHT_PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  continueButtonHover: {
    backgroundColor: BRIGHT_PURPLE,
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(167, 139, 250, 0.6)',
      },
      default: {
        shadowColor: BRIGHT_PURPLE,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  continueButtonText: {
    color: WHITE,
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
    backgroundColor: WHITE,
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
    borderLeftColor: WHITE,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightWidth: 0,
  },
});

export default styles;

