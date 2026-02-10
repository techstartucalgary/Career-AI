import { StyleSheet, Platform, Dimensions } from 'react-native';
import { THEME } from '../../styles/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const { colors: COLORS } = THEME;
const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const BRIGHT_PURPLE = '#A78BFA';
const WHITE = '#ffffff';
const TEXT_LIGHT = '#D1D5DB';
const ERROR_RED = '#EF4444';
const GRAY_BACKGROUND = '#2D1B3D';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: isDesktop ? 18 : 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 16,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emailLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  emailValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  formCard: {
    width: '100%',
    maxWidth: 1000,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: isDesktop ? 48 : isTablet ? 40 : 32,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 40,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(28px)',
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
  formRow: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: isDesktop ? 32 : 24,
  },
  formColumn: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    gap: 24,
  },
  inputGroup: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.bgAlt,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    color: COLORS.white,
    fontSize: 16,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.18)',
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
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1000,
    paddingHorizontal: isDesktop ? 48 : 0,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  backButtonHover: {
    backgroundColor: 'rgba(167, 139, 250, 0.10)',
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        borderColor: COLORS.primary,
      },
      default: {
        shadowOpacity: 0.3,
      },
    }),
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
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
        boxShadow: '0 6px 20px rgba(167, 139, 250, 0.35)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 7,
      },
    }),
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;

