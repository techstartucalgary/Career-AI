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
    ...Platform.select({
      web: {
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
    minHeight: isDesktop ? 600 : 400,
    shadowColor: COLORS.lightPurple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
    shadowColor: COLORS.lightPurple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    position: 'relative',
  },
  searchIconCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    top: 0,
    left: 0,
  },
  searchIconLine: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: COLORS.textMuted,
    transform: [{ rotate: '45deg' }],
    bottom: 2,
    right: 2,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    gap: 8,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  tagClose: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tagCloseLine1: {
    position: 'absolute',
    width: 12,
    height: 2,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '45deg' }],
  },
  tagCloseLine2: {
    position: 'absolute',
    width: 12,
    height: 2,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '-45deg' }],
  },
  jobDescriptionInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    color: COLORS.textPrimary,
    fontSize: 16,
    minHeight: 200,
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
  previewArea: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 80,
    overflow: 'hidden',
    position: 'relative',
  },
  previewIcon: {
    marginBottom: 16,
  },
  documentIcon: {
    width: 64,
    height: 80,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: COLORS.textMuted,
    backgroundColor: 'transparent',
  },
  previewText: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
    backgroundColor: '#10B981',
    borderRadius: 4,
    ...Platform.select({
      web: {
        transition: 'width 0.3s ease',
      },
    }),
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: 32,
    right: 32,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'flex-end',
    shadowColor: COLORS.lightPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(167, 139, 250, 0.3)',
      },
    }),
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
  generateButtonDisabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  downloadButtonDisabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  previewScroll: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    minHeight: 400,
  },
  resumePreviewText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 22,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  uploadButton: {
    backgroundColor: COLORS.darkPurple,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.lightPurple,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  uploadButtonHover: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderColor: COLORS.brightPurple,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
    position: 'relative',
  },
  uploadIconArrow: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: COLORS.lightPurple,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '-135deg' }],
    position: 'absolute',
    top: 8,
    left: 8,
  },
  uploadButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  selectedFileText: {
    color: COLORS.brightPurple,
    fontSize: 14,
    marginTop: 8,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
});

export default styles;
