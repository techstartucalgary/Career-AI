import { StyleSheet, Platform, Dimensions } from 'react-native';
import { THEME } from '../../styles/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const { colors: COLORS } = THEME;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    marginBottom: 32,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A78BFA',
    letterSpacing: 0.5,
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
    overflow: 'visible',
    zIndex: 2,
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
    gap: isDesktop ? 48 : 32,
    overflow: 'visible',
  },
  formColumn: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    gap: 32,
    overflow: 'visible',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 0,
    overflow: 'visible',
  },
  inputGroupOpen: {
    zIndex: 1000,
    overflow: 'visible',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  selectContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'visible',
  },
  selectContainerOpen: {
    zIndex: 1000,
    overflow: 'visible',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgAlt,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    minHeight: 48,
    ...Platform.select({
      web: {
        cursor: 'pointer',
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
  selectInputOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectText: {
    fontSize: 16,
    color: COLORS.white,
    flex: 1,
  },
  selectPlaceholder: {
    color: '#8B7AB8',
    opacity: 0.7,
  },
  selectArrow: {
    marginLeft: 8,
  },
  arrowTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.textSecondary,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s ease',
      },
    }),
  },
  arrowTriangleUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      web: {
        position: 'fixed',
        zIndex: 998,
      },
    }),
  },
  selectOptionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgAlt,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1001,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  selectOptionsScroll: {
    maxHeight: 200,
  },
  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      },
    }),
  },
  selectOptionSelected: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
  },
  selectOptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  selectOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1000,
    paddingHorizontal: isDesktop ? 48 : 0,
    zIndex: 0,
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
  saveButton: {
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
  saveButtonHover: {
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
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;
