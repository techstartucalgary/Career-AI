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
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
    width: '100%',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: DARK_PURPLE,
    borderWidth: 1,
    borderColor: LIGHT_PURPLE,
    gap: 8,
  },
  tabActive: {
    backgroundColor: LIGHT_PURPLE,
    borderColor: LIGHT_PURPLE,
  },
  tabText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  tabTextActive: {
    color: WHITE,
  },
  checkmarkContainer: {
    width: 14,
    height: 14,
    position: 'relative',
  },
  checkmarkLine1: {
    position: 'absolute',
    left: 2,
    bottom: 4,
    width: 6,
    height: 2,
    backgroundColor: WHITE,
    transform: [{ rotate: '-45deg' }],
  },
  checkmarkLine2: {
    position: 'absolute',
    left: 4,
    bottom: 2,
    width: 8,
    height: 2,
    backgroundColor: WHITE,
    transform: [{ rotate: '45deg' }],
  },
  heroTitle: {
    fontSize: isDesktop ? 56 : isTablet ? 48 : 36,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
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
    color: '#1F2937',
    fontSize: 16,
  },
  searchFilters: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  filterChipText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  filterArrowIcon: {
    width: 12,
    height: 12,
    position: 'relative',
  },
  filterArrowUp: {
    position: 'absolute',
    top: 0,
    left: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: WHITE,
  },
  filterArrowDown: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: WHITE,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 20,
    fontFamily: Platform.select({
      web: 'Georgia, serif',
      default: 'serif',
    }),
  },
  quickActions: {
    marginTop: 20,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  actionsGrid: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    flex: isDesktop ? 1 : isTablet ? 0.48 : 1,
    backgroundColor: '#2D1B3D',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: LIGHT_PURPLE,
    minWidth: isTablet ? 200 : '100%',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  actionCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 8,
  },
  actionCardDesc: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
});

export default styles;
