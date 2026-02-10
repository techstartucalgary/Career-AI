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
  },
  formColumn: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    gap: 32,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(167, 139, 250, 0.25)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    gap: 8,
  },
  tagText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  tagRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  tagRemoveText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  checkboxContainer: {
    gap: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px rgba(167, 139, 250, 0.4)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  checkmark: {
    width: 12,
    height: 12,
    position: 'relative',
  },
  checkmarkLine1: {
    position: 'absolute',
    width: 4,
    height: 2,
    backgroundColor: COLORS.white,
    top: 6,
    left: 2,
    transform: [{ rotate: '45deg' }],
  },
  checkmarkLine2: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: COLORS.white,
    top: 4,
    left: 4,
    transform: [{ rotate: '-45deg' }],
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
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



