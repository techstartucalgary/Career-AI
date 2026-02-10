import { StyleSheet, Platform, Dimensions } from 'react-native';
import { THEME } from '../styles/theme';

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
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: isDesktop ? 52 : isTablet ? 44 : 36,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 32,
        elevation: 16,
      },
    }),
    position: 'relative',
    overflow: 'visible',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(28px)',
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
    borderColor: COLORS.primary,
    top: -100,
    right: -100,
  },
  cardCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: COLORS.bgAlt,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoStar: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.white,
    transform: [{ rotate: '45deg' }],
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    ...Platform.select({
      web: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        textShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
      },
      default: {
        fontFamily: 'sans-serif',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
      },
    }),
  },
  titleSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: isDesktop ? 32 : isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
    ...Platform.select({
      web: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        textShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
      },
      default: {
        fontFamily: 'sans-serif',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 12,
      },
    }),
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
    marginBottom: 28,
    ...Platform.select({
      web: {
        position: 'relative',
        zIndex: 1,
        overflow: 'visible',
      },
    }),
  },
  inputGroupOpen: {
    ...Platform.select({
      web: {
        zIndex: 2000,
      },
      default: {
        zIndex: 2000,
      },
    }),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
    color: COLORS.white,
    backgroundColor: COLORS.bgAlt,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        transition: 'all 0.3s ease',
      },
    }),
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        boxShadow: `0 0 0 3px rgba(167, 139, 250, 0.25)`,
      },
    }),
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 6,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  submitButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: COLORS.primary,
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
    backgroundColor: COLORS.primaryDark,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  submitButtonText: {
    color: COLORS.white,
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
    backgroundColor: COLORS.borderLight,
    opacity: 0.3,
  },
  dividerText: {
    color: COLORS.textMuted,
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
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  switchLink: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  demographicSection: {
    marginTop: 8,
    marginBottom: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  demographicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  demographicSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
        zIndex: 11000,
      },
      default: {
        zIndex: 11000,
      },
    }),
  },
  selectInput: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.white,
    backgroundColor: COLORS.bgAlt,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
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
    borderColor: COLORS.primary,
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
    color: COLORS.white,
  },
  selectPlaceholder: {
    color: COLORS.textMuted,
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
    borderTopColor: COLORS.textSecondary,
    borderBottomWidth: 0,
  },
  arrowTriangleUp: {
    borderTopWidth: 0,
    borderBottomWidth: 6,
    borderBottomColor: COLORS.textSecondary,
  },
  dropdownOverlay: {
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Must sit behind the options list so option clicks work on web.
        zIndex: 10900,
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
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderTopWidth: 0,
    maxHeight: 200,
    ...Platform.select({
      web: {
        zIndex: 11000,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      default: {
        zIndex: 1000,
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
    borderBottomColor: COLORS.border,
  },
  selectOptionSelected: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
  },
  selectOptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  selectOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default styles;

