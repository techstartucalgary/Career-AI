import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const BRIGHT_PURPLE = '#A78BFA';
const WHITE = '#ffffff';
const TEXT_LIGHT = '#D1D5DB';

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
    alignItems: 'center',
    minHeight: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 56,
    width: '100%',
    position: 'relative',
    minHeight: 200,
    justifyContent: 'center',
  },
  headerVisual: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.1,
  },
  headerCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: BRIGHT_PURPLE,
    top: -50,
    left: -100,
  },
  headerCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    bottom: -50,
    right: -50,
  },
  headerBadge: {
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
    zIndex: 1,
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
  mainTitle: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 16,
    textAlign: 'center',
    zIndex: 1,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
    textShadowColor: LIGHT_PURPLE,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 18,
    color: TEXT_LIGHT,
    textAlign: 'center',
    opacity: 0.9,
    zIndex: 1,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  optionsContainer: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    gap: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  optionCard: {
    flex: isDesktop ? 1 : isTablet ? 0.48 : 1,
    backgroundColor: '#2D1B3D',
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    minWidth: isTablet ? 280 : '100%',
    maxWidth: isDesktop ? 380 : '100%',
    alignItems: 'center',
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  optionCardHover: {
    transform: [{ translateY: -4 }],
    borderColor: BRIGHT_PURPLE,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    backgroundColor: '#3D2B4D',
  },
  optionIcon: {
    width: 64,
    height: 64,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconStar: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: BRIGHT_PURPLE,
    transform: [{ rotate: '45deg' }],
  },
  iconDocument: {
    width: 28,
    height: 36,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: BRIGHT_PURPLE,
    position: 'absolute',
    left: 4,
    top: 8,
  },
  iconDocumentFold: {
    position: 'absolute',
    top: 8,
    right: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: BRIGHT_PURPLE,
  },
  iconGear: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BRIGHT_PURPLE,
    position: 'absolute',
    right: 4,
    bottom: 8,
  },
  iconGearInner: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BRIGHT_PURPLE,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  optionDescription: {
    fontSize: 15,
    color: TEXT_LIGHT,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
});

export default styles;




