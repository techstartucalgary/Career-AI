import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_PURPLE,
  },
  contentContainer: {
    flex: 1,
    flexDirection: width > 768 ? 'row' : 'column',
  },
  sidebar: {
    width: width > 768 ? 300 : '100%',
    padding: 24,
    backgroundColor: DARK_PURPLE,
    borderRightWidth: width > 768 ? 1 : 0,
    borderRightColor: LIGHT_PURPLE,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  backArrow: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  backArrowLine: {
    position: 'absolute',
    left: 0,
    top: 11,
    width: 16,
    height: 2,
    backgroundColor: WHITE,
  },
  backArrowHead: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: WHITE,
  },
  actionButtons: {
    gap: 16,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIGHT_PURPLE,
    backgroundColor: 'transparent',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  actionButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentWrapper: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    padding: 32,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  jobTitle: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: WHITE,
    lineHeight: 40,
    marginRight: 24,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
  },
  bookmarkButton: {
    padding: 8,
  },
  bookmarkIcon: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  bookmarkShape: {
    position: 'absolute',
    width: 20,
    height: 24,
    borderWidth: 2,
    borderColor: WHITE,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 0,
    backgroundColor: 'transparent',
  },
  section: {
    marginBottom: 40,
  },
  sectionHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 20,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
  },
  sectionSubtext: {
    fontSize: 16,
    color: WHITE,
    marginBottom: 16,
    lineHeight: 24,
  },
  paragraph: {
    fontSize: 16,
    color: WHITE,
    lineHeight: 28,
    marginBottom: 20,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 16,
    color: WHITE,
    marginRight: 12,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: WHITE,
    lineHeight: 24,
  },
});

export default styles;
