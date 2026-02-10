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
  contentRow: {
    flexDirection: isDesktop ? 'row' : 'column',
    width: '100%',
    maxWidth: 1200,
    gap: isDesktop ? 48 : 32,
    marginBottom: 40,
    alignItems: isDesktop ? 'center' : 'stretch',
  },
  textSection: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    justifyContent: 'center',
    alignItems: isDesktop ? 'flex-start' : 'center',
  },
  title: {
    fontSize: isDesktop ? 56 : isTablet ? 48 : 36,
    fontWeight: 'bold',
    color: COLORS.white,
    lineHeight: isDesktop ? 68 : isTablet ? 58 : 44,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
  uploadSection: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
  },
  requiredLabel: {
    fontSize: 14,
    color: WHITE,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: isDesktop ? 'left' : 'center',
  },
  uploadCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: isDesktop ? 48 : isTablet ? 40 : 32,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(28px)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
      },
    }),
  },
  uploadArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  uploadAreaDragging: {
    opacity: 0.8,
  },
  uploadIcon: {
    width: 80,
    height: 80,
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudIcon: {
    width: 60,
    height: 40,
    position: 'relative',
  },
  cloudCircle1: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.textMuted,
    top: 0,
    left: 0,
  },
  cloudCircle2: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: COLORS.textMuted,
    top: -5,
    right: 0,
  },
  cloudCircle3: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: COLORS.textMuted,
    bottom: 0,
    left: 15,
  },
  uploadArrow: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 24,
    height: 24,
  },
  arrowLine: {
    position: 'absolute',
    top: 11,
    left: 4,
    width: 12,
    height: 2,
    backgroundColor: COLORS.textMuted,
    transform: [{ rotate: '45deg' }],
  },
  arrowHead: {
    position: 'absolute',
    top: 8,
    right: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftColor: COLORS.textMuted,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightWidth: 0,
  },
  uploadText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  fileDisplay: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentIcon: {
    width: 28,
    height: 36,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#4A5568',
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  extractingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  extractingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1200,
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
    opacity: 1,
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
  continueButtonDisabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
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
  errorContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
});

export default styles;

