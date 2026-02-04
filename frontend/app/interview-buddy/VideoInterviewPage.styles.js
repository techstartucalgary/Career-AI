import { StyleSheet, Platform, Dimensions } from 'react-native';
import { THEME } from '../../src/styles/theme';

const { width, height } = Dimensions.get('window');
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
  // Preview Screen Styles
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
    paddingTop: 100,
  },
  videoPreviewArea: {
    width: '100%',
    maxWidth: isDesktop ? 1200 : isTablet ? 900 : '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#4A4A4A',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 15,
      },
    }),
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A4A4A',
  },
  placeholderIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderHead: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2A2A2A',
    marginBottom: 20,
  },
  placeholderBody: {
    width: 160,
    height: 100,
    borderRadius: 80,
    backgroundColor: '#2A2A2A',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    width: '100%',
    maxWidth: isDesktop ? 1200 : isTablet ? 900 : '100%',
    paddingHorizontal: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  selectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  controlButtonHover: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    ...Platform.select({
      web: {
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
  startButtonHover: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(167, 139, 250, 0.35)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  controlIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    width: 12,
    height: 18,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'relative',
  },
  cameraIcon: {
    width: 20,
    height: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 3,
    position: 'relative',
  },
  controlButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
    paddingTop: 100,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: isDesktop ? 56 : isTablet ? 48 : 40,
    width: '100%',
    maxWidth: 700,
    borderWidth: 1.5,
    borderColor: COLORS.border,
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
  loadingTitle: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
  loadingList: {
    gap: 24,
  },
  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  loadingCheckmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  loadingCheckmarkActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(167, 139, 250, 0.4)',
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
  checkmarkIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  checkmarkLine1: {
    position: 'absolute',
    width: 6,
    height: 2,
    backgroundColor: COLORS.white,
    top: 12,
    left: 4,
    transform: [{ rotate: '45deg' }],
  },
  checkmarkLine2: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: COLORS.white,
    top: 10,
    left: 6,
    transform: [{ rotate: '-45deg' }],
  },
  loadingItemText: {
    flex: 1,
    fontSize: isDesktop ? 20 : 18,
    color: COLORS.textSecondary,
    lineHeight: 28,
  },
  // Interview Screen Styles
  interviewContainer: {
    flex: 1,
    flexDirection: isDesktop ? 'row' : 'column',
    padding: isDesktop ? 32 : isTablet ? 24 : 16,
    paddingTop: 100,
    gap: 24,
  },
  videoFeedContainer: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    aspectRatio: isDesktop ? undefined : 16 / 9,
  },
  videoFeed: {
    width: '100%',
    height: isDesktop ? '100%' : undefined,
    backgroundColor: '#4A4A4A',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(139, 122, 184, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 15,
      },
    }),
  },
  questionsContainer: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: isDesktop ? 32 : isTablet ? 28 : 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
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
  questionHeader: {
    marginBottom: 24,
  },
  questionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(167, 139, 250, 0.4)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  questionBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 16,
  },
  questionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  questionIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  questionIconLine1: {
    position: 'absolute',
    width: 6,
    height: 2,
    backgroundColor: COLORS.white,
    top: 12,
    left: 4,
    transform: [{ rotate: '45deg' }],
  },
  questionIconLine2: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: COLORS.white,
    top: 10,
    left: 6,
    transform: [{ rotate: '-45deg' }],
  },
  questionText: {
    flex: 1,
    fontSize: isDesktop ? 20 : 18,
    color: COLORS.textPrimary,
    lineHeight: 28,
    fontWeight: '500',
  },
  answerSection: {
    marginBottom: 24,
  },
  answerLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  answerInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 20,
    minHeight: 150,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  answerInput: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  answerInputActive: {
    color: COLORS.textPrimary,
    opacity: 1,
  },
  answerInputPlaceholder: {
    opacity: 0.6,
  },
  interviewControls: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'flex-end',
  },
  interviewButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  interviewButtonHover: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  skipButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
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
  submitButtonHover: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(167, 139, 250, 0.35)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;

