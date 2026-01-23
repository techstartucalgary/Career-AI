import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const COLORS = {
  bg: '#08080C',
  bgAlt: '#0C0C12',
  surface: '#12121A',
  surfaceLight: '#1A1A24',
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.1)',
  primary: '#A78BFA',
  primaryDark: '#8B5CF6',
  primaryLight: '#C4B5FD',
  accent: '#6366F1',
  white: '#FFFFFF',
  textPrimary: 'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
};

export default StyleSheet.create({
  // Base
  homepage: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
  },

  // ==================== HERO SECTION ====================
  heroSection: {
    minHeight: isDesktop ? 900 : 800,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 60,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px',
      },
    }),
  },
  glowOrb1: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    top: -200,
    left: -200,
    ...Platform.select({
      web: {
        filter: 'blur(120px)',
        animation: 'orbFloat1 20s ease-in-out infinite',
      },
    }),
  },
  glowOrb2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    bottom: -100,
    right: -100,
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
        animation: 'orbFloat2 25s ease-in-out infinite',
      },
    }),
  },
  glowOrb3: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    top: '50%',
    left: '50%',
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
        animation: 'pulse 8s ease-in-out infinite',
      },
    }),
  },

  // Floating UI Elements
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: isDesktop ? 'flex' : 'none',
  },
  floatingCard1: {
    position: 'absolute',
    top: '15%',
    left: '8%',
  },
  floatingCard2: {
    position: 'absolute',
    top: '25%',
    right: '10%',
  },
  floatingCard3: {
    position: 'absolute',
    bottom: '25%',
    left: '12%',
  },
  floatingCard4: {
    position: 'absolute',
    bottom: '20%',
    right: '8%',
  },

  // Mini Card Styles
  miniCard: {
    backgroundColor: 'rgba(18, 18, 26, 0.9)',
    borderRadius: 12,
    padding: 16,
    width: 180,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      },
    }),
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  miniHeaderLines: {
    flex: 1,
    gap: 4,
  },
  miniLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  miniCardBody: {
    gap: 6,
    marginBottom: 12,
  },
  miniCardTags: {
    flexDirection: 'row',
    gap: 6,
  },
  miniTag: {
    width: 40,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
  },

  // Mini Job Card
  miniJobCard: {
    backgroundColor: 'rgba(18, 18, 26, 0.9)',
    borderRadius: 10,
    padding: 12,
    width: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
      },
    }),
  },
  miniJobCardHighlighted: {
    borderColor: 'rgba(167, 139, 250, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 16px 32px rgba(167, 139, 250, 0.15)',
      },
    }),
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  companyLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  companyLogoHighlighted: {
    backgroundColor: COLORS.primary,
  },
  jobCardInfo: {
    flex: 1,
    gap: 3,
  },
  matchBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobCardTags: {
    flexDirection: 'row',
    gap: 6,
  },
  jobTag: {
    width: 50,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  jobTagHighlighted: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },

  // Mini Stats Card
  miniStatsCard: {
    backgroundColor: 'rgba(18, 18, 26, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
      },
    }),
  },
  miniStatsLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  // Mini Notification
  miniNotification: {
    backgroundColor: 'rgba(18, 18, 26, 0.9)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
      },
    }),
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(39, 202, 63, 0.2)',
  },
  notificationContent: {
    gap: 4,
  },

  // Progress Ring
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  progressRingFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },

  // Hero Content
  heroContent: {
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
  },
  heroBadge: {
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
  badgePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
        animation: 'pulse 2s ease-in-out infinite',
        boxShadow: '0 0 12px rgba(167, 139, 250, 0.6)',
      },
    }),
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: isDesktop ? 72 : isTablet ? 56 : 42,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: isDesktop ? 80 : isTablet ? 64 : 50,
    marginBottom: 24,
    letterSpacing: -1.5,
  },
  heroTitleGradient: {
    color: COLORS.primary,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      },
    }),
  },
  heroSubtitle: {
    fontSize: isDesktop ? 18 : 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: 540,
  },
  heroButtons: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 16,
    marginBottom: 48,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 20px rgba(167, 139, 250, 0.3)',
      },
    }),
  },
  primaryButtonHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -2 }],
        boxShadow: '0 8px 30px rgba(167, 139, 250, 0.4)',
      },
    }),
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  buttonArrow: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: COLORS.white,
    fontSize: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 28,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  secondaryButtonHover: {
    ...Platform.select({
      web: {
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.05)',
      },
    }),
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  // Social Proof
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.bg,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
  },
  socialProofText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  socialProofHighlight: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Scroll Indicator
  scrollIndicator: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  scrollLine: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      web: {
        animation: 'scrollPulse 2s ease-in-out infinite',
      },
    }),
  },

  // ==================== PROBLEM SECTION ====================
  problemSection: {
    paddingVertical: 100,
    backgroundColor: COLORS.bgAlt,
  },
  problemCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, rgba(18,18,26,0.8) 0%, rgba(12,12,18,0.9) 100%)',
        backdropFilter: 'blur(40px)',
      },
    }),
  },
  problemCardInner: {
    padding: isDesktop ? 60 : 32,
  },
  problemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  problemTitle: {
    fontSize: isDesktop ? 40 : 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 40,
  },
  problemStats: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: isDesktop ? 0 : 24,
    marginBottom: 40,
  },
  problemStat: {
    flex: 1,
    alignItems: isDesktop ? 'center' : 'flex-start',
  },
  problemStatNumber: {
    fontSize: isDesktop ? 56 : 48,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: isDesktop ? 60 : 52,
  },
  problemStatLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: isDesktop ? 'center' : 'left',
    lineHeight: 20,
  },
  problemStatDivider: {
    width: isDesktop ? 1 : '100%',
    height: isDesktop ? 80 : 1,
    backgroundColor: COLORS.border,
    display: isDesktop ? 'flex' : 'none',
  },
  problemDescription: {
    fontSize: 17,
    color: COLORS.textSecondary,
    lineHeight: 28,
    maxWidth: 600,
  },

  // ==================== STEPS SECTION ====================
  stepsSection: {
    paddingVertical: 100,
    backgroundColor: COLORS.bg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: isDesktop ? 40 : 28,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 60,
  },
  stepsContainer: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 40,
  },
  stepIndicators: {
    flex: isDesktop ? 1 : undefined,
    gap: 16,
  },
  stepIndicator: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  stepIndicatorActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
  },
  stepIndicatorHovered: {
    ...Platform.select({
      web: {
        backgroundColor: COLORS.surfaceLight,
      },
    }),
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
  stepNumberActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  stepTitleActive: {
    color: COLORS.white,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  stepProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
        animation: 'progressFill 4s linear',
        width: '100%',
      },
    }),
  },

  // Step Preview
  stepPreview: {
    flex: isDesktop ? 1.5 : undefined,
  },
  stepPreviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  previewWindow: {
    minHeight: 360,
  },
  windowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  windowDots: {
    flexDirection: 'row',
    gap: 6,
  },
  windowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  windowTitle: {
    flex: 1,
    alignItems: 'center',
  },

  // Upload Preview
  uploadPreview: {
    padding: 40,
    alignItems: 'center',
  },
  uploadZone: {
    width: '100%',
    maxWidth: 300,
    padding: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.03)',
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIconText: {
    fontSize: 24,
    color: COLORS.primary,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  uploadProgress: {
    width: '100%',
    maxWidth: 300,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 24,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    ...Platform.select({
      web: {
        animation: 'progressFill 2s ease-in-out infinite',
      },
    }),
  },

  // Match Preview
  matchPreview: {
    padding: 20,
  },
  matchHeader: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  matchResults: {
    gap: 8,
  },

  // Apply Preview
  applyPreview: {
    padding: 20,
  },
  applyHeader: {
    marginBottom: 20,
  },
  applyTabs: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
  },
  applyTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyTabActive: {
    backgroundColor: COLORS.primary,
  },
  applyTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  applyTabTextInactive: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  applyContent: {
    alignItems: 'center',
    gap: 20,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },

  // ==================== FEATURES SECTION ====================
  featuresSection: {
    paddingVertical: 100,
    backgroundColor: COLORS.bgAlt,
  },
  featureCardWrapper: {
    marginBottom: 24,
  },
  featureCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, rgba(18,18,26,0.6) 0%, rgba(12,12,18,0.8) 100%)',
        backdropFilter: 'blur(40px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }),
  },
  featureCardHovered: {
    borderColor: 'rgba(167, 139, 250, 0.2)',
    ...Platform.select({
      web: {
        transform: [{ translateY: -4 }],
        boxShadow: '0 20px 60px rgba(167, 139, 250, 0.1)',
      },
    }),
  },
  featureCardGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      },
    }),
  },
  featureCardContent: {
    flexDirection: isDesktop ? 'row' : 'column',
    padding: isDesktop ? 48 : 32,
    gap: 40,
  },
  featureCardLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: isDesktop ? 32 : 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
    lineHeight: isDesktop ? 40 : 32,
  },
  featureDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 26,
  },
  featureCardRight: {
    flex: isDesktop ? 1.2 : undefined,
  },
  featureUIContainer: {
    backgroundColor: 'rgba(12, 12, 18, 0.6)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        transition: 'all 0.4s ease',
      },
    }),
  },
  featureUIContainerHovered: {
    ...Platform.select({
      web: {
        transform: [{ scale: 1.02 }],
      },
    }),
  },

  // Auto-Apply UI
  autoApplyUI: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 16,
  },
  criteriaPanel: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  criteriaPanelTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  criteriaItem: {
    gap: 4,
  },
  criteriaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  criteriaValue: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  criteriaValueText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  queuePanel: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 16,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queueTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  queueBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  queueBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  queueItems: {
    gap: 8,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 10,
  },
  queueItemLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  queueItemCompany: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  queueItemStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueItemStatusSent: {
    backgroundColor: 'rgba(39, 202, 63, 0.2)',
  },
  queueItemStatusText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Resume Tailor UI
  resumeTailorUI: {
    gap: 20,
  },
  resumeCompare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resumeOriginal: {
    flex: 1,
  },
  resumeTailored: {
    flex: 1,
  },
  resumeCompareLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
    textAlign: 'center',
  },
  resumeDoc: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  resumeDocHighlighted: {
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  resumeDocSection: {
    gap: 6,
  },
  highlightedLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  resumeArrow: {
    paddingHorizontal: 8,
  },
  resumeArrowText: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  keywordBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  keywordBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  keywordText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  matchScorePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  matchScoreInfo: {
    flex: 1,
  },
  matchScoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  matchScoreDesc: {
    fontSize: 12,
    color: '#27CA3F',
  },

  // Cover Letter UI
  coverLetterUI: {
    gap: 16,
  },
  letterDoc: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  letterHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  letterBody: {
    gap: 12,
  },
  letterGreeting: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  letterParagraph: {
    gap: 6,
  },
  letterLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  letterLineTyping: {
    ...Platform.select({
      web: {
        animation: 'typing 2s ease-in-out infinite',
        background: 'linear-gradient(90deg, rgba(167,139,250,0.3) 0%, rgba(255,255,255,0.08) 50%, rgba(167,139,250,0.3) 100%)',
        backgroundSize: '200% 100%',
      },
    }),
  },
  letterFooter: {
    paddingTop: 12,
  },
  letterSignature: {},
  letterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  letterAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingVertical: 10,
  },
  letterActionPrimary: {
    backgroundColor: COLORS.primary,
  },
  letterActionIcon: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  letterActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },

  // Interview UI
  interviewUI: {
    gap: 16,
  },
  questionPanel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  answerPanel: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerRecording: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    ...Platform.select({
      web: {
        animation: 'pulse 1s ease-in-out infinite',
      },
    }),
  },
  recordingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  answerTimer: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  answerWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 40,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
        animation: 'waveform 0.5s ease-in-out infinite alternate',
      },
    }),
  },
  feedbackHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 191, 36, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  feedbackHintIcon: {
    fontSize: 14,
  },
  feedbackHintText: {
    fontSize: 12,
    color: '#FFBF24',
  },

  // ==================== CTA SECTION ====================
  ctaSection: {
    paddingVertical: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  ctaBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaGlow1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    top: -200,
    left: '20%',
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
    }),
  },
  ctaGlow2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    bottom: -150,
    right: '10%',
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
      },
    }),
  },
  ctaTitle: {
    fontSize: isDesktop ? 48 : 32,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  ctaButton: {
    alignSelf: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }),
  },
  ctaButtonHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -2 }, { scale: 1.02 }],
        boxShadow: '0 20px 40px rgba(167, 139, 250, 0.3)',
      },
    }),
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 36,
    gap: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  ctaButtonArrow: {
    fontSize: 18,
    color: COLORS.white,
  },
  ctaNote: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },

  // ==================== FOOTER ====================
  footer: {
    paddingVertical: 40,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Chat bubbles (kept for compatibility)
  chatBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  chatBubbleAI: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  chatBubbleUser: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  aiIndicator: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  aiIndicatorText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
  },
  chatLines: {
    gap: 6,
  },
  chatLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
