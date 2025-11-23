import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const padding = 16;
const gap = 8; // gap between cards
const cardSize = (width - (padding * 2) - (gap * 2)) / 3; // 3 columns with padding and gaps

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#212529',
    fontWeight: 'bold',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: '#212529',
    fontWeight: 'bold',
  },
  filterWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  filterContainer: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  filterButtonSelected: {
    backgroundColor: '#e7f1ff',
    borderColor: '#0d6efd',
  },
  checkmark: {
    fontSize: 14,
    color: '#0d6efd',
    marginRight: 6,
    fontWeight: 'bold',
  },
  filterText: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#212529',
  },
  gridWrapper: {
    flex: 1,
  },
  gridContainer: {
    padding: padding,
    paddingBottom: padding * 2,
  },
  gridRow: {
    justifyContent: 'flex-start',
    marginBottom: gap,
  },
  jobCard: {
    width: cardSize,
    height: cardSize,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: gap,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  jobCardLast: {
    marginRight: 0,
  },
  cardIconContainer: {
    marginBottom: 8,
  },
  cardIcon: {
    width: 48,
    height: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShape1: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0d6efd',
  },
  iconShape2: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    width: 10,
    height: 10,
    backgroundColor: '#0d6efd',
    borderRadius: 2,
  },
  iconShape3: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 12,
    height: 12,
    backgroundColor: '#0d6efd',
    borderRadius: 2,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
    textAlign: 'center',
  },
  jobUpdated: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default styles;

