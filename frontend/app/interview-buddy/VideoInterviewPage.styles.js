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
  scrollView: {
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
  // Setup Screen Styles (simplified start screen)
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
    paddingTop: 120,
  },
  setupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: isDesktop ? 48 : isTablet ? 40 : 32,
    width: '100%',
    maxWidth: 650,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 40,
        elevation: 20,
      },
    }),
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  startInterviewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 32,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(167, 139, 250, 0.35)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  startInterviewButtonDisabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  startInterviewButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
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
    flexWrap: 'wrap',
  },
  dropdownGroup: {
    minWidth: 200,
    gap: 6,
  },
  dropdownLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownSelect: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: COLORS.textPrimary,
    borderRadius: 10,
    border: `1px solid ${COLORS.borderLight}`,
    padding: 10,
    fontSize: 14,
    outlineWidth: 0,
  },
  jobInputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  jobInputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
    width: '100%',
    maxWidth: 600,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    maxHeight: '80vh',
  },
  jobInputTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 24,
  },
  jobInputGroup: {
    marginBottom: 20,
  },
  jobInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  jobInputText: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  jobInputButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  jobInputButtonDisabled: {
    opacity: 0.5,
  },
  jobInputButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  orbPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(167, 139, 250, 0.6)',
      },
    }),
  },
  orbActive: {
    transform: [{ scale: 1.1 }],
    backgroundColor: COLORS.primaryDark,
    ...Platform.select({
      web: {
        boxShadow: '0 0 18px rgba(167, 139, 250, 0.9)',
      },
    }),
  },
  orbTextWrapper: {
    gap: 2,
  },
  orbLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  orbStatus: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  speakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
  },
  speakingDotActive: {
    backgroundColor: COLORS.primary,
  },
  speakingText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
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
    position: 'relative',
    overflow: 'hidden',
  },
  questionBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 0,
    borderColor: 'transparent',
    pointerEvents: 'none',
  },
  questionBorderActive: {
    borderWidth: 3,
    borderColor: '#A78BFA',
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 0 20px rgba(167, 139, 250, 0.4), 0 0 20px rgba(167, 139, 250, 0.6)',
      },
      default: {
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 15,
      },
    }),
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
  postureCard: {
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(167, 139, 250, 0.15)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  postureCardActive: {
    borderColor: 'rgba(167, 139, 250, 0.6)',
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    ...Platform.select({
      web: {
        boxShadow: '0 6px 24px rgba(167, 139, 250, 0.3)',
        animation: 'posturePulse 1.5s ease-in-out',
      },
    }),
  },
  postureTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  postureMessage: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  answerSection: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
        overflow: 'visible',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
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
  answerTextInput: {
    marginTop: 12,
    minHeight: 80,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  transcriptionBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  transcriptionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  // Live transcription styles
  liveTranscriptionBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    minHeight: 80,
  },
  liveTranscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveTranscriptionBoxInactive: {
    borderColor: 'rgba(100, 100, 100, 0.5)',
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#666',
    marginRight: 8,
  },
  liveIndicatorActive: {
    backgroundColor: '#22C55E',
    ...Platform.select({
      web: {
        animation: 'pulse 1.5s ease-in-out infinite',
      },
    }),
  },
  liveTranscriptionLabel: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  clearButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  liveTranscriptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    minHeight: 48,
  },
  interimText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  listeningText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  // Live Feedback Box - Clean styling
  liveFeedbackBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  liveFeedbackPositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  liveFeedbackNeedsWork: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  liveFeedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveFeedbackTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  liveFeedbackScore: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(59, 130, 246, 1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 8,
  },
  scoreGood: {
    color: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  scoreNeedsWork: {
    color: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  liveFeedbackTip: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: 6,
    fontWeight: '400',
  },
  // Answer Controls (buttons inside answer section)
  answerControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  answerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  answerButtonDisabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  answerButtonHover: {
    transform: [{ scale: 1.02 }],
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  interviewButtonHover: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  interviewButtonDisabled: {
    opacity: 0.5,
  },
  skipButtonText: {
    color: COLORS.textPrimary,
    fontSize: 15,
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
  submitButtonDisabled: {
    opacity: 0.6,
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
  // New styles for recording, scrolling, and file upload
  questionsScroll: {
    flex: isDesktop ? 1 : undefined,
    ...Platform.select({
      web: {
        overflow: 'visible',
      },
    }),
  },
  videoWrapperSpeaking: {
    borderColor: '#A78BFA',
    borderWidth: 3,
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(167, 139, 250, 0.6)',
      },
      default: {
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 20,
      },
    }),
  },
  videoWrapperRecording: {
    borderColor: '#A78BFA',
    borderWidth: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 0 30px rgba(167, 139, 250, 0.8)',
        animation: 'pulse 2s infinite',
      },
      default: {
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 25,
        elevation: 25,
      },
    }),
  },
  recordingContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    gap: 10,
    minWidth: 200,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  recordButtonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: '#DC2626',
    ...Platform.select({
      web: {
        boxShadow: '0 0 12px rgba(220, 38, 38, 0.4)',
      },
    }),
  },
  recordButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  recordIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  micIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  fileUploadLabel: {
    display: 'block',
    cursor: 'pointer',
  },
  fileUploadButton: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'dashed',
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    flexDirection: 'row',
    gap: 10,
  },
  fileUploadButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default styles;

