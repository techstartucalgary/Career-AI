import { StyleSheet, Platform, Dimensions } from 'react-native';
import { THEME } from '../styles/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const LIGHT_PURPLE = THEME.colors.lightPurple;
const BRIGHT_PURPLE = THEME.colors.primary;
const WHITE = THEME.colors.white;
const TEXT_LIGHT = THEME.colors.textLight;
const TEXT_MUTED = THEME.colors.textMuted;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileLayoutNarrow: {
    flex: 1,
  },
  layoutWithSidebar: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    gap: 8,
    ...Platform.select({
      web: {
        minHeight: 0,
      },
    }),
  },
  profileSidebar: {
    width: 208,
    flexShrink: 0,
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
    marginRight: 8,
  },
  profileSidebarHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  profileNavLink: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  profileNavLinkPressed: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
  },
  profileNavLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_LIGHT,
  },
  mainScroll: {
    flex: 1,
    minWidth: 0,
  },
  mainScrollContent: {
    paddingTop: 32,
    paddingBottom: 80,
  },
  scrollInnerWithSidebar: {
    width: '100%',
    maxWidth: 920,
  },
  content: {
    padding: isDesktop ? 60 : isTablet ? 40 : 24,
    paddingTop: isDesktop ? 40 : 30,
    paddingBottom: 80,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  
  // Header Section (hero rhythm aligned with JobsExplore / onboarding)
  headerSection: {
    marginBottom: 32,
  },
  titleContainer: {
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
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
  heroBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRIGHT_PURPLE,
    ...Platform.select({
      web: {
        boxShadow: '0 0 12px rgba(167, 139, 250, 0.6)',
      },
    }),
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: BRIGHT_PURPLE,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 34,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: isDesktop ? 56 : isTablet ? 48 : 42,
    letterSpacing: -1,
    ...Platform.select({
      web: {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
      default: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  subtitle: {
    fontSize: 18,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  statusText: {
    fontSize: 14,
    color: TEXT_LIGHT,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#F87171',
    textAlign: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: '#34D399',
    textAlign: 'center',
    marginTop: 12,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceLight,
    borderWidth: 3,
    borderColor: BRIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(167, 139, 250, 0.4)',
      },
      default: {
        shadowColor: BRIGHT_PURPLE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
    elevation: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '700',
    color: BRIGHT_PURPLE,
    letterSpacing: 2,
  },
  avatarActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  avatarActionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: BRIGHT_PURPLE,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  avatarActionLinkMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  avatarActionDisabled: {
    opacity: 0.5,
  },
  avatarName: {
    fontSize: 24,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 4,
  },
  avatarRole: {
    fontSize: 16,
    color: TEXT_MUTED,
  },

  // Cards Container
  cardsContainer: {
    gap: 24,
  },

  // Card
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: isDesktop ? 32 : isTablet ? 28 : 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BRIGHT_PURPLE,
    marginBottom: 24,
  },
  infoGroup: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 15,
    color: WHITE,
    fontWeight: '600',
  },
  preferenceSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 12,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  inputWithButtonField: {
    flex: 1,
    minHeight: 52,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        boxSizing: 'border-box',
      },
      default: {
        elevation: 0,
      },
    }),
  },
  addButtonPressed: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderColor: 'rgba(167, 139, 250, 0.55)',
  },
  addButtonGlyph: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: BRIGHT_PURPLE,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
      web: {
        marginTop: -1,
        lineHeight: 22,
      },
    }),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    gap: 8,
  },
  tagText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  tagRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  tagRemoveText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  radioGroup: {
    gap: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: THEME.colors.borderLight,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transition: 'border-color 0.2s ease',
      },
    }),
  },
  radioOuterSelected: {
    borderColor: BRIGHT_PURPLE,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.35)',
      },
    }),
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRIGHT_PURPLE,
  },
  radioLabel: {
    fontSize: 14,
    color: TEXT_LIGHT,
    flex: 1,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_LIGHT,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: WHITE,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        transition: 'all 0.2s ease',
      },
    }),
  },
  readOnlyInput: {
    opacity: 0.7,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: BRIGHT_PURPLE,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#4B5563',
    marginHorizontal: 16,
  },

  // Save Button
  saveButton: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(167, 139, 250, 0.4)',
        transition: 'all 0.2s ease',
      },
      default: {
        shadowColor: BRIGHT_PURPLE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
  },
  saveButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  
  // Resume Section
  resumeContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  resumeLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 4,
    fontWeight: '500',
  },
  resumeFileName: {
    fontSize: 14,
    color: BRIGHT_PURPLE,
    fontWeight: '600',
  },
  noResumeText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  uploadButton: {
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: BRIGHT_PURPLE,
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  uploadButtonDisabled: {
    opacity: 0.6,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRIGHT_PURPLE,
  },
  resumeActionRow: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 10,
    marginTop: 10,
  },
  resumeActionButton: {
    flex: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  resumeRemoveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  resumeActionButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  saveButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.5,
  },
});

export default styles;
