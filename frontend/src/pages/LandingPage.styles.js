import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8'; // lighter purple accent
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  homepage: {
    flex: 1,
    backgroundColor: DARK_PURPLE,
  },
  container: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
  },
  heroSection: {
    paddingVertical: 140,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    minHeight: 600,
    justifyContent: 'center',
  },
  heroVisualContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.12,
  },
  heroCircle1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    borderWidth: 2,
    borderColor: '#A78BFA',
    top: -150,
    left: -150,
  },
  heroCircle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    bottom: -100,
    right: -100,
  },
  heroCircle3: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: '#A78BFA',
    top: 100,
    right: 150,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 900,
    zIndex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    marginBottom: 28,
    gap: 10,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A78BFA',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    letterSpacing: 1,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  heroTitle: {
    fontSize: isDesktop ? 72 : isTablet ? 60 : 44,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: isDesktop ? 84 : isTablet ? 72 : 54,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
    textShadowColor: LIGHT_PURPLE,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 24,
  },
  heroTitleAccent: {
    color: '#A78BFA',
    textShadowColor: '#A78BFA',
  },
  heroSubtitle: {
    fontSize: isDesktop ? 20 : 18,
    color: WHITE,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 28,
    opacity: 0.95,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 180,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 15px rgba(139, 122, 184, 0.4)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
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
  primaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: WHITE,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 180,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(255, 255, 255, 0.1)',
      },
      default: {
        shadowColor: WHITE,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  secondaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingVertical: 80,
    paddingHorizontal: 20,
    backgroundColor: DARK_PURPLE,
    position: 'relative',
  },
  splitSection: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 60,
    alignItems: 'center',
  },
  splitLeft: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
  },
  splitRight: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
  },
  sectionTitle: {
    fontSize: isDesktop ? 42 : isTablet ? 36 : 28,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 20,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
    ...Platform.select({
      web: {
        textShadowColor: 'rgba(139, 122, 184, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 15,
      },
    }),
  },
  sectionText: {
    fontSize: 18,
    color: WHITE,
    lineHeight: 28,
    marginBottom: 20,
    opacity: 0.9,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  bulletList: {
    marginTop: 12,
  },
  bulletPoint: {
    fontSize: 18,
    color: WHITE,
    lineHeight: 32,
    marginBottom: 8,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  centeredTitle: {
    fontSize: isDesktop ? 42 : isTablet ? 36 : 28,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
    ...Platform.select({
      web: {
        textShadowColor: 'rgba(139, 122, 184, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 15,
      },
    }),
  },
  centeredSubtitle: {
    fontSize: 18,
    color: WHITE,
    textAlign: 'center',
    marginBottom: 60,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  stepsContainer: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    gap: 40,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  stepCard: {
    alignItems: 'center',
    flex: isDesktop ? 1 : undefined,
    minWidth: isTablet ? 200 : '100%',
    maxWidth: 300,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      web: {
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'default',
      },
      default: {},
    }),
  },
  stepCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(139, 122, 184, 0.4)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      },
      default: {
        shadowColor: LIGHT_PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  stepNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: WHITE,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  stepDescription: {
    fontSize: 16,
    color: WHITE,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  placeholderBox: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: DARK_PURPLE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(139, 122, 184, 0.2), inset 0 0 40px rgba(139, 122, 184, 0.05)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: LIGHT_PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  placeholderIcon: {
    width: 120,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHead: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: WHITE,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(255, 255, 255, 0.2)',
      },
    }),
  },
  iconBubble: {
    position: 'absolute',
    top: -10,
    right: -20,
    width: 40,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: WHITE,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)',
      },
    }),
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 3px 12px rgba(139, 122, 184, 0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
      default: {
        shadowColor: LIGHT_PURPLE,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },
  inlineButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  inlineButtonArrow: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  arrowLine: {
    position: 'absolute',
    left: 0,
    top: 7,
    width: 12,
    height: 2,
    backgroundColor: WHITE,
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: WHITE,
  },
  finalCtaSection: {
    paddingVertical: 100,
    paddingHorizontal: 20,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 30px rgba(139, 122, 184, 0.3)',
      },
    }),
  },
  finalCtaTitle: {
    fontSize: isDesktop ? 42 : isTablet ? 36 : 28,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
    ...Platform.select({
      web: {
        textShadowColor: 'rgba(31, 28, 47, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 20,
      },
    }),
  },
  finalCtaSubtitle: {
    fontSize: 18,
    color: WHITE,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.95,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  finalCtaButton: {
    backgroundColor: DARK_PURPLE,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(31, 28, 47, 0.4)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
      default: {
        shadowColor: DARK_PURPLE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  finalCtaButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
  // Hover styles
  primaryButtonHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -2 }],
        boxShadow: '0 6px 25px rgba(139, 122, 184, 0.5)',
        backgroundColor: '#9B8AC8',
      },
    }),
  },
  secondaryButtonHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -2 }],
        boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    }),
  },
  inlineButtonHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -2 }],
        boxShadow: '0 5px 18px rgba(139, 122, 184, 0.4)',
        backgroundColor: '#9B8AC8',
      },
    }),
  },
  finalCtaButtonHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -3 }],
        boxShadow: '0 8px 25px rgba(31, 28, 47, 0.5)',
        backgroundColor: '#2A2540',
      },
    }),
  },
  stepCardHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -5 }],
      },
    }),
  },
  stepCircleHover: {
    ...Platform.select({
      web: {
        transform: [{ scale: 1.1 }],
        boxShadow: '0 6px 25px rgba(139, 122, 184, 0.5)',
      },
    }),
  },
  placeholderBoxHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -3 }],
        boxShadow: '0 6px 25px rgba(139, 122, 184, 0.3), inset 0 0 50px rgba(139, 122, 184, 0.08)',
        borderColor: '#9B8AC8',
      },
    }),
  },
});

export default styles;
