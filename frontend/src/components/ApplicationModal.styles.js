import { StyleSheet, Platform } from 'react-native';

const COLORS = {
  bg: '#08080C',
  surface: '#12121A',
  surfaceLight: '#1A1A24',
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.1)',
  primary: '#A78BFA',
  primaryDark: '#8B5CF6',
  white: '#FFFFFF',
  textPrimary: 'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#EF4444',
};

const styles = StyleSheet.create({
  overlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    ...Platform.select({
      web: { backdropFilter: 'blur(8px)' },
      default: {},
    }),
  },

  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    width: '92%',
    maxWidth: 560,
    maxHeight: '85%',
    ...Platform.select({
      web: { boxShadow: '0 24px 48px rgba(0,0,0,0.6)' },
      default: { elevation: 24 },
    }),
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Progress bar
  progressContainer: {
    marginBottom: 20,
  },

  progressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '500',
  },

  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: { transition: 'width 0.5s ease' },
      default: {},
    }),
  },

  progressFillSuccess: {
    backgroundColor: COLORS.success,
  },

  progressFillWarning: {
    backgroundColor: COLORS.warning,
  },

  progressFillDanger: {
    backgroundColor: COLORS.danger,
  },

  // Steps timeline
  stepsContainer: {
    maxHeight: 280,
    marginBottom: 16,
  },

  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 10,
  },

  stepIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },

  stepIconPending: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  stepIconActive: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },

  stepIconCompleted: {
    backgroundColor: 'rgba(52,211,153,0.15)',
  },

  stepIconFailed: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },

  stepIconWarning: {
    backgroundColor: 'rgba(251,191,36,0.15)',
  },

  stepIconText: {
    fontSize: 11,
    fontWeight: '700',
  },

  stepContent: {
    flex: 1,
  },

  stepMessage: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },

  stepMessageMuted: {
    color: COLORS.textMuted,
  },

  stepDetails: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Screenshot
  screenshotContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },

  screenshotLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    padding: 8,
    paddingBottom: 4,
    fontWeight: '500',
  },

  screenshotImage: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnSuccess: {
    backgroundColor: COLORS.success,
  },

  btnWarning: {
    backgroundColor: COLORS.warning,
  },

  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },

  btnTextDark: {
    color: COLORS.bg,
  },

  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Status badges
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 12,
    gap: 6,
  },

  statusBadgeSuccess: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.2)',
  },

  statusBadgeWarning: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },

  statusBadgeFailed: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },

  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Spinner animation (web only)
  spinner: {
    ...Platform.select({
      web: {
        animationKeyframes: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      },
      default: {},
    }),
  },
});

export { COLORS };
export default styles;
