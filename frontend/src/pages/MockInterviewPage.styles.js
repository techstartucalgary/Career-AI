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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
    paddingTop: 40,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
    minHeight: 180,
    justifyContent: 'center',
  },
  headerVisual: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.1,
  },
  headerCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: COLORS.primary,
    top: -30,
    left: -80,
  },
  headerCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    bottom: -30,
    right: -60,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.22)',
    marginBottom: 20,
    gap: 8,
    zIndex: 1,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  title: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
    textAlign: 'center',
    zIndex: 1,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    ...Platform.select({
      web: {
        textShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 16,
      },
    }),
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    maxWidth: 600,
  },
  categorySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  categoryGrid: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    gap: 16,
    flexWrap: 'wrap',
  },
  categoryCard: {
    flex: isDesktop ? 1 : isTablet ? 0.48 : 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    gap: 12,
    minWidth: isTablet ? 180 : '100%',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  categoryCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(167, 139, 250, 0.06)',
  },
  categoryCardHover: {
    transform: [{ translateY: -2 }],
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(167, 139, 250, 0.4)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  categoryIcon: {
    width: 32,
    height: 32,
    position: 'relative',
  },
  categoryIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  categoryIconLine: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 8,
    height: 2,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '45deg' }],
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 32,
  },
  infoIcon: {
    width: 40,
    height: 40,
    marginBottom: 16,
    position: 'relative',
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  infoIconLine1: {
    position: 'absolute',
    top: 8,
    left: 16,
    width: 2,
    height: 8,
    backgroundColor: COLORS.primary,
  },
  infoIconLine2: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    width: 2,
    height: 8,
    backgroundColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
    minWidth: 250,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  startButtonHover: {
    transform: [{ translateY: -2 }],
    backgroundColor: COLORS.primaryDark,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  interviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    width: '100%',
    minWidth: 0,
  },
  interviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  questionCard: {
    width: '100%',
    minWidth: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  questionIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
    position: 'relative',
  },
  questionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  questionIconLine1: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 2,
    height: 12,
    backgroundColor: COLORS.primary,
  },
  questionIconLine2: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    width: 2,
    height: 12,
    backgroundColor: COLORS.primary,
  },
  questionText: {
    width: '100%',
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 28,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
    ...Platform.select({
      web: {
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      },
    }),
  },
  answerSection: {
    marginBottom: 24,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  answerInput: {
    width: '100%',
    minWidth: 0,
    alignSelf: 'stretch',
    backgroundColor: COLORS.bgAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    color: COLORS.white,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
      },
    }),
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  primaryButtonDisabled: {
    backgroundColor: '#4B4B4B',
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  primaryButtonHover: {
    transform: [{ translateY: -2 }],
    backgroundColor: COLORS.primaryDark,
    shadowOpacity: 0.6,
    shadowRadius: 14,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  secondaryButtonHover: {
    transform: [{ translateY: -2 }],
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading (shared)
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── Quick Feedback (per-question, compact) ──────────────────────
  qfCard: {
    marginBottom: 24,
    gap: 16,
  },
  qfGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.15)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      },
      default: {
        backgroundColor: COLORS.surface,
      },
    }),
  },
  qfInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 18,
  },
  qfScoreWrap: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  qfScore: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  qfScoreBar: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  qfContent: {
    flex: 1,
    gap: 6,
  },
  qfText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  qfTipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qfTipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  qfTip: {
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
    fontWeight: '500',
  },

  // ── Results / Full Review ───────────────────────────────────────
  rvContainer: {
    gap: 24,
  },

  // Loading card
  rvLoadingCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rvLoadingGradient: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  rvLoadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  rvLoadingSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Hero score area
  rvHero: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  rvEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  rvScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  rvBigScore: {
    fontSize: isDesktop ? 72 : 56,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: isDesktop ? 72 : 56,
  },
  rvScoreMeta: {
    paddingBottom: isDesktop ? 10 : 6,
    gap: 2,
  },
  rvScoreWord: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  rvScoreOutOf: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  rvSummary: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 520,
    marginTop: 4,
  },

  // Section divider
  rvDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  rvSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Question card
  rvCard: {
    borderRadius: 20,
    padding: isDesktop ? 28 : 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  rvCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  rvCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rvCardNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(167,139,250,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rvCardNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  rvCardScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    gap: 6,
  },
  rvCardScoreDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rvCardScoreVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  rvCardSkipPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rvCardSkipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  rvCardQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },

  // Your answer (left-bar quote style)
  rvYourAnswer: {
    flexDirection: 'row',
    gap: 12,
  },
  rvYourAnswerBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  rvYourAnswerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Detailed feedback
  rvDetailedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Strengths / Improvements columns
  rvColumns: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: isDesktop ? 24 : 14,
  },
  rvCol: {
    flex: 1,
    gap: 8,
  },
  rvColLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rvBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rvBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  rvBulletText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  // Sample answer
  rvSample: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.15)',
    gap: 6,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(99,102,241,0.04) 100%)',
        backdropFilter: 'blur(12px)',
      },
      default: {
        backgroundColor: 'rgba(167,139,250,0.06)',
      },
    }),
  },
  rvSampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rvSampleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  rvActions: {
    marginTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
});

export default styles;

