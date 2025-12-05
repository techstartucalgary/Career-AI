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
    overflow: 'hidden',
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
      web: 'Georgia, serif',
      default: 'serif',
    }),
    textShadowColor: LIGHT_PURPLE,
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
      web: 'Georgia, serif',
      default: 'serif',
    }),
    textShadowColor: LIGHT_PURPLE,
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
  },
  inputGroup: {
    marginBottom: 20,
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
    color: BRIGHT_PURPLE,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default styles;

