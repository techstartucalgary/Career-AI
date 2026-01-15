import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const BRIGHT_PURPLE = '#A78BFA';
const WHITE = '#ffffff';
const TEXT_LIGHT = '#D1D5DB';
const ERROR_RED = '#EF4444';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_PURPLE,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
    overflow: 'visible',
  },
  scrollView: {
    ...Platform.select({
      web: {
        overflow: 'visible',
      },
    }),
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#2D1B3D',
    borderRadius: 28,
    padding: isDesktop ? 52 : isTablet ? 44 : 36,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
    position: 'relative',
    overflow: 'visible',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
  cardVisual: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.08,
  },
  cardCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: BRIGHT_PURPLE,
    top: -100,
    right: -100,
  },
  cardCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    bottom: -80,
    left: -80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DARK_PURPLE,
    borderWidth: 3,
    borderColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoStar: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: WHITE,
    transform: [{ rotate: '45deg' }],
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  titleSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: isDesktop ? 32 : isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  formSection: {
    width: '100%',
    ...Platform.select({
      web: {
        position: 'relative',
        overflow: 'visible',
      },
    }),
  },
  inputGroup: {
    marginBottom: 20,
    ...Platform.select({
      web: {
        position: 'relative',
        zIndex: 1,
      },
    }),
  },
  inputGroupOpen: {
    ...Platform.select({
      web: {
        zIndex: 100,
      },
    }),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 8,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: WHITE,
    backgroundColor: DARK_PURPLE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        transition: 'all 0.3s ease',
      },
    }),
  },
  inputFocused: {
    borderColor: BRIGHT_PURPLE,
    shadowColor: BRIGHT_PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        boxShadow: `0 0 0 3px ${BRIGHT_PURPLE}40`,
      },
    }),
  },
  inputError: {
    borderColor: ERROR_RED,
  },
  errorText: {
    color: ERROR_RED,
    fontSize: 12,
    marginTop: 6,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  submitButton: {
    width: '100%',
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  submitButtonHover: {
    transform: [{ translateY: -2 }],
    backgroundColor: BRIGHT_PURPLE,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  submitButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_PURPLE,
    opacity: 0.3,
  },
  dividerText: {
    color: TEXT_LIGHT,
    fontSize: 14,
    paddingHorizontal: 16,
    opacity: 0.7,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  switchButtonHover: {
    transform: [{ translateY: -1 }],
  },
  switchText: {
    color: TEXT_LIGHT,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  switchLink: {
    color: TEXT_LIGHT,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  demographicSection: {
    marginTop: 8,
    marginBottom: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 122, 184, 0.2)',
  },
  demographicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 6,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  demographicSubtitle: {
    fontSize: 13,
    color: TEXT_LIGHT,
    opacity: 0.8,
    lineHeight: 18,
  },
  selectContainer: {
    position: 'relative',
    zIndex: 50,
    overflow: 'visible',
  },
  selectContainerOpen: {
    ...Platform.select({
      web: {
        zIndex: 1000,
      },
      default: {
        zIndex: 1000,
      },
    }),
  },
  selectInput: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: WHITE,
    backgroundColor: DARK_PURPLE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  selectInputOpen: {
    borderColor: BRIGHT_PURPLE,
    ...Platform.select({
      web: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
    }),
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: WHITE,
  },
  selectPlaceholder: {
    color: '#8B7AB8',
  },
  selectArrow: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: TEXT_LIGHT,
    borderBottomWidth: 0,
  },
  arrowTriangleUp: {
    borderTopWidth: 0,
    borderBottomWidth: 6,
    borderBottomColor: TEXT_LIGHT,
  },
  dropdownOverlay: {
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        backgroundColor: 'transparent',
      },
      default: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        backgroundColor: 'transparent',
      },
    }),
  },
  selectOptionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 2,
    backgroundColor: '#2D1B3D',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1.5,
    borderColor: BRIGHT_PURPLE,
    borderTopWidth: 0,
    maxHeight: 200,
    ...Platform.select({
      web: {
        zIndex: 1001,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      default: {
        zIndex: 1001,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
  selectOptionsScroll: {
    maxHeight: 200,
  },
  selectOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 122, 184, 0.1)',
  },
  selectOptionSelected: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
  },
  selectOptionText: {
    fontSize: 16,
    color: TEXT_LIGHT,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  selectOptionTextSelected: {
    color: WHITE,
    fontWeight: '600',
  },
});

export default styles;

