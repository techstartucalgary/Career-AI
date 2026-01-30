import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

// Landing Page Color System
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  downloadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'flex-end',
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
});

export default styles;
