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
  white: '#FFFFFF',
  textPrimary: 'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
};

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
  content: {
    padding: 24,
    paddingTop: 40,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
    width: '100%',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    marginBottom: 20,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: isDesktop ? 40 : isTablet ? 36 : 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
    maxWidth: 700,
    lineHeight: 28,
  },
  panelsContainer: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 24,
    alignItems: 'flex-start',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  rightPanel: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    minHeight: isDesktop ? 600 : 400,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  modeButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  templateCard: {
    flex: isDesktop ? 0.48 : 1,
    minWidth: isDesktop ? 140 : '100%',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  templateCardHover: {
    borderColor: COLORS.primary,
    transform: [{ translateY: -2 }],
  },
  templatePreview: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentIcon: {
    width: 40,
    height: 50,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  templateName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  uploadButtonHover: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  uploadButtonText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  fileName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  jobDescriptionInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    color: COLORS.textPrimary,
    fontSize: 16,
    minHeight: 180,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(167, 139, 250, 0.3)',
      },
    }),
  },
  generateButtonHover: {
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(167, 139, 250, 0.4)',
      },
    }),
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  atsScorePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    flex: 1,
    minHeight: 64,
  },
  atsScoreInfo: {
    flex: 1,
  },
  atsScoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  atsScoreDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  atsScoreMeta: {
    fontSize: 12,
    color: '#27CA3F',
    marginTop: 4,
  },
  atsScoreError: {
    fontSize: 12,
    color: '#F87171',
    marginTop: 6,
  },
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  progressText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  previewArea: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
    padding: 32,
  },
  placeholderContent: {
    position: 'absolute',
    top: 40,
    left: 40,
    right: 40,
    gap: 12,
  },
  placeholderLine: {
    height: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 6,
    width: '100%',
  },
  previewIcon: {
    marginBottom: 16,
  },
  previewText: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    fontWeight: '500',
    position: 'relative',
    zIndex: 5,
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: '#F87171',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    ...Platform.select({
      web: {
        transition: 'width 0.3s ease',
      },
    }),
  },
  actionRow: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 16,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(167, 139, 250, 0.3)',
      },
    }),
  },
  downloadButtonInline: {
    flex: 1,
    alignSelf: 'stretch',
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonHover: {
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(167, 139, 250, 0.4)',
      },
    }),
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resumeContentScroll: {
    flex: 1,
    maxHeight: 600,
    marginBottom: 16,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  resumeContent: {
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 12,
  },
  resumeSection: {
    marginBottom: 24,
  },
  resumeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  resumeContactInfo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resumeSummary: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 12,
    lineHeight: 18,
  },
  resumeSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5E7EB',
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  resumeEntry: {
    marginBottom: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3F4F6',
    flex: 1,
  },
  entryDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  entryCompany: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
    marginBottom: 4,
  },
  entryLocation: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  entryBullet: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 16,
    marginBottom: 4,
  },
  bulletHighlighted: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  resumeSkills: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  coverLetterContent: {
    backgroundColor: '#1F2937',
    padding: 32,
    borderRadius: 12,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
  },
  coverLetterHeader: {
    marginBottom: 24,
  },
  coverLetterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  coverLetterContactInfo: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  coverLetterDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  coverLetterBody: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 16,
  },
  coverLetterClosing: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 24,
    marginBottom: 16,
  },
  coverLetterSignature: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 32,
  },
});

export default styles;
