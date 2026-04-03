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
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
    paddingTop: 40,
    alignItems: 'center',
    minHeight: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 56,
    width: '100%',
    position: 'relative',
    minHeight: 200,
    justifyContent: 'center',
  },
  headerVisual: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.05,
  },
  headerCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: COLORS.primary,
    top: -50,
    left: -100,
  },
  headerCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primary,
    bottom: -50,
    right: -50,
    opacity: 0.6,
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
    marginBottom: 24,
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
    fontWeight: '500',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
    textAlign: 'center',
    zIndex: 1,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    zIndex: 1,
    lineHeight: 28,
  },
  optionsContainer: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    gap: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  optionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: isTablet ? 320 : '100%',
    maxWidth: isDesktop ? 440 : '100%',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  optionCardHover: {
    transform: [{ translateY: -4 }],
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(167, 139, 250, 0.2)',
      },
    }),
  },
  optionIcon: {
    width: 64,
    height: 64,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 26,
    textAlign: 'center',
  },
});

export default styles;
