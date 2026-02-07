import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const BRIGHT_PURPLE = '#A78BFA';
const CARD_BG = '#2D1B3D';
const WHITE = '#ffffff';
const TEXT_LIGHT = '#D1D5DB';
const TEXT_MUTED = '#9CA3AF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_PURPLE,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: isDesktop ? 60 : isTablet ? 40 : 24,
    paddingTop: isDesktop ? 40 : 30,
    paddingBottom: 80,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  
  // Header Section
  headerSection: {
    marginBottom: 32,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: isDesktop ? 42 : isTablet ? 36 : 32,
    fontWeight: '800',
    color: WHITE,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isDesktop ? 18 : 16,
    color: TEXT_MUTED,
    textAlign: 'center',
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
    backgroundColor: CARD_BG,
    borderWidth: 3,
    borderColor: BRIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRIGHT_PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '700',
    color: BRIGHT_PURPLE,
    letterSpacing: 2,
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
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: isDesktop ? 32 : isTablet ? 28 : 24,
    borderWidth: 1,
    borderColor: LIGHT_PURPLE,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
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
    gap: 12,
    marginBottom: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(167, 139, 250, 0.4)',
      },
      default: {
        shadowColor: BRIGHT_PURPLE,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    color: WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
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
  checkboxContainer: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
  checkboxChecked: {
    backgroundColor: BRIGHT_PURPLE,
    borderColor: BRIGHT_PURPLE,
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px rgba(167, 139, 250, 0.4)',
      },
      default: {
        shadowColor: BRIGHT_PURPLE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  checkmark: {
    width: 12,
    height: 12,
    position: 'relative',
  },
  checkmarkLine1: {
    position: 'absolute',
    width: 4,
    height: 2,
    backgroundColor: WHITE,
    top: 6,
    left: 2,
    transform: [{ rotate: '45deg' }],
  },
  checkmarkLine2: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: WHITE,
    top: 4,
    left: 4,
    transform: [{ rotate: '-45deg' }],
  },
  checkboxLabel: {
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
    backgroundColor: '#1F1C2F',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: WHITE,
    borderWidth: 1,
    borderColor: '#4B5563',
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
    shadowColor: BRIGHT_PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
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
    backgroundColor: '#1F1C2F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
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
    backgroundColor: '#1F1C2F',
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
