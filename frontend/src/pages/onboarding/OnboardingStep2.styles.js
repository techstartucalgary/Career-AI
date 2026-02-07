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
const UPLOAD_GRAY = '#E5E7EB';

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
    color: WHITE,
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
    backgroundColor: UPLOAD_GRAY,
    borderRadius: 20,
    padding: isDesktop ? 48 : isTablet ? 40 : 32,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139, 122, 184, 0.3)',
    borderStyle: 'dashed',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
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
    backgroundColor: '#4A5568',
    top: 0,
    left: 0,
  },
  cloudCircle2: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#4A5568',
    top: -5,
    right: 0,
  },
  cloudCircle3: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#4A5568',
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
    backgroundColor: '#4A5568',
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
    borderLeftColor: '#4A5568',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightWidth: 0,
  },
  uploadText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    fontWeight: '500',
  },
  fileDisplay: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    color: '#1F2937',
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
    color: WHITE,
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
    color: '#4A5568',
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
    opacity: 1,
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
  continueButtonDisabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
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

