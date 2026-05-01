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
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#EF4444',
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
    padding: isDesktop ? 48 : isTablet ? 32 : 24,
    paddingTop: isDesktop ? 60 : 48,
    paddingBottom: 60,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },

  // Hero
  heroSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 800,
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
    marginBottom: 20,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(167, 139, 250, 0.6)' },
    }),
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: isDesktop ? 56 : isTablet ? 48 : 40,
    letterSpacing: -1,
  },
  heroTitleAccent: {
    color: COLORS.primary,
  },
  heroDescription: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(167, 139, 250, 0.3)' },
    }),
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // Stats bar (Analytics)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: isDesktop ? 200 : isTablet ? 160 : '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...Platform.select({
      web: { backdropFilter: 'blur(20px)' },
    }),
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Pipeline columns
  pipelineContainer: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 16,
  },
  pipelineColumn: {
    flex: 1,
    minWidth: isDesktop ? 240 : '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  columnCount: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  columnCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  columnCards: {
    gap: 12,
  },

  // Pipeline / Match card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  cardHover: {
    borderColor: COLORS.primary,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(167, 139, 250, 0.15)' },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardCompany: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  cardLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  matchBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  matchLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  // Card footer actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  actionButtonTextSecondary: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  actionButtonTextDanger: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.danger,
  },

  // Status selector
  statusSelector: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusOption: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' },
    }),
  },
  statusOptionActive: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  statusOptionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  statusOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Cover letter indicator
  coverLetterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  coverLetterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  coverLetterText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Activity feed
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Settings form
  settingsSection: {
    gap: 24,
  },
  settingsGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 20,
    ...Platform.select({
      web: { backdropFilter: 'blur(20px)' },
    }),
  },
  settingsGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: { outlineStyle: 'none', transition: 'border-color 0.2s ease' },
    }),
  },
  textInputFocused: {
    borderColor: COLORS.primary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  tagRemove: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },

  // Radio / Toggle
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radioOption: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.2s ease' } }),
  },
  radioOptionActive: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  radioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  radioTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer', transition: 'background-color 0.2s ease' } }),
  },
  toggleTrackOn: {
    backgroundColor: COLORS.primary,
  },
  toggleTrackOff: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    ...Platform.select({ web: { transition: 'transform 0.2s ease' } }),
  },
  toggleThumbOn: {
    ...Platform.select({ web: { transform: 'translateX(20px)' } }),
  },
  toggleThumbOff: {
    ...Platform.select({ web: { transform: 'translateX(0px)' } }),
  },

  // Slider
  sliderContainer: {
    gap: 8,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'right',
  },

  // Save button
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading / Empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 22,
  },
});

export default styles;
