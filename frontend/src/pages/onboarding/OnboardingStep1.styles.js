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
    color: WHITE,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
    textShadowColor: 'rgba(167, 139, 250, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: isDesktop ? 18 : 16,
    color: TEXT_LIGHT,
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
    backgroundColor: 'rgba(139, 122, 184, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 122, 184, 0.3)',
  },
  emailLabel: {
    fontSize: 14,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  emailValue: {
    fontSize: 14,
    color: WHITE,
    fontWeight: '600',
  },
  formCard: {
    width: '100%',
    maxWidth: 1000,
    backgroundColor: 'rgba(45, 27, 61, 0.8)',
    borderRadius: 24,
    padding: isDesktop ? 48 : isTablet ? 40 : 32,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 122, 184, 0.4)',
    marginBottom: 40,
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
    color: TEXT_LIGHT,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: WHITE,
    fontSize: 16,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
  inputFocused: {
    borderColor: BRIGHT_PURPLE,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.2)',
      },
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
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
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
  backButtonHover: {
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
  backButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
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
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;

