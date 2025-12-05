import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isDesktop = width > 992;

const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_PURPLE,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    minHeight: '100%',
  },
  mainCard: {
    width: '100%',
    maxWidth: 1200,
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 16,
    padding: 40,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
      },
    }),
  },
  mainTitle: {
    fontSize: isDesktop ? 36 : isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: DARK_PURPLE,
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
  },
  optionsContainer: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    gap: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  optionCard: {
    flex: isDesktop ? 1 : isTablet ? 0.48 : 1,
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#A78BFA',
    minWidth: isTablet ? 250 : '100%',
    maxWidth: isDesktop ? 350 : '100%',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      },
    }),
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 12,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  optionDescription: {
    fontSize: 16,
    color: WHITE,
    lineHeight: 24,
    opacity: 0.9,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
});

export default styles;




