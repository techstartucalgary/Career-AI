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
const PREVIEW_GRAY = '#E5E7EB';

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
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    marginBottom: 20,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRIGHT_PURPLE,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_LIGHT,
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  headerTitle: {
    fontSize: isDesktop ? 40 : isTablet ? 36 : 28,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  headerText: {
    fontSize: 18,
    color: TEXT_LIGHT,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.9,
    maxWidth: 700,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  panelsContainer: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 24,
    alignItems: 'flex-start',
  },
  leftPanel: {
    flex: isDesktop ? 1 : 1,
    backgroundColor: GRAY_BACKGROUND,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 122, 184, 0.3)',
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  rightPanel: {
    flex: isDesktop ? 1 : 1,
    backgroundColor: GRAY_BACKGROUND,
    borderRadius: 20,
    padding: 32,
    minHeight: isDesktop ? 600 : 400,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 122, 184, 0.3)',
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 16,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'sans-serif',
    }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_PURPLE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: LIGHT_PURPLE,
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
    borderColor: '#9CA3AF',
    top: 0,
    left: 0,
  },
  searchIconLine: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#9CA3AF',
    transform: [{ rotate: '45deg' }],
    bottom: 2,
    right: 2,
  },
  searchInput: {
    flex: 1,
    color: WHITE,
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
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  tagText: {
    color: WHITE,
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
    backgroundColor: WHITE,
    transform: [{ rotate: '45deg' }],
  },
  tagCloseLine2: {
    position: 'absolute',
    width: 12,
    height: 2,
    backgroundColor: WHITE,
    transform: [{ rotate: '-45deg' }],
  },
  jobDescriptionInput: {
    backgroundColor: DARK_PURPLE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_PURPLE,
    color: WHITE,
    fontSize: 16,
    minHeight: 200,
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  generateButton: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  generateButtonHover: {
    transform: [{ translateY: -2 }],
    backgroundColor: BRIGHT_PURPLE,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  generateButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
  previewArea: {
    flex: 1,
    backgroundColor: PREVIEW_GRAY,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    marginBottom: 20,
  },
  previewIcon: {
    marginBottom: 16,
  },
  documentIcon: {
    width: 64,
    height: 80,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#9CA3AF',
    backgroundColor: 'transparent',
  },
  previewText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.select({
      web: 'system-ui, sans-serif',
      default: 'sans-serif',
    }),
  },
  downloadButton: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'flex-end',
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  downloadButtonHover: {
    transform: [{ translateY: -2 }],
    backgroundColor: BRIGHT_PURPLE,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  downloadButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;

