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
