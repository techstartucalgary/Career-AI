import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const BRIGHT_PURPLE = '#A78BFA';
const WHITE = '#ffffff';
const TEXT_LIGHT = '#D1D5DB';
const GRAY_BACKGROUND = '#2D1B3D';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: isDesktop ? 18 : 16,
    color: TEXT_LIGHT,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 24,
    opacity: 0.9,
  },
  formCard: {
    width: '100%',
    maxWidth: 1000,
    backgroundColor: 'rgba(45, 27, 61, 0.8)',
    borderRadius: 24,
    padding: isDesktop ? 48 : isTablet ? 40 : 32,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 122, 184, 0.4)',
    marginBottom: 40,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 12,
      },
    }),
  },
  formRow: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: isDesktop ? 48 : 32,
  },
  formColumn: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    gap: 32,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 16,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: WHITE,
    fontSize: 16,
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
  inputFocused: {
    borderColor: BRIGHT_PURPLE,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.2)',
      },
    }),
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
    gap: 16,
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
    width: 24,
    height: 24,
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
    fontSize: 16,
    color: TEXT_LIGHT,
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1000,
    paddingHorizontal: isDesktop ? 48 : 0,
  },
  backButton: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(139, 122, 184, 0.4)',
      },
      default: {
        shadowColor: LIGHT_PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  backButtonHover: {
    backgroundColor: BRIGHT_PURPLE,
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(167, 139, 250, 0.6)',
      },
      default: {
        shadowColor: BRIGHT_PURPLE,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  backButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(139, 122, 184, 0.4)',
      },
      default: {
        shadowColor: LIGHT_PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  saveButtonHover: {
    backgroundColor: BRIGHT_PURPLE,
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(167, 139, 250, 0.6)',
      },
      default: {
        shadowColor: BRIGHT_PURPLE,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  saveButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;



