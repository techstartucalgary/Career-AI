import { StyleSheet, Platform } from 'react-native';

const DARK_PURPLE = '#1F1C2F';
const LIGHT_PURPLE = '#8B7AB8';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  header: {
    backgroundColor: DARK_PURPLE,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_PURPLE,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  container: {
    width: '100%',
    maxWidth: 1400,
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DARK_PURPLE,
    borderWidth: 2,
    borderColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStar: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: WHITE,
    transform: [{ rotate: '45deg' }],
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  navLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLink: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  navLinkActive: {
    textDecorationLine: 'underline',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIGHT_PURPLE,
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  arrowIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  arrowLine: {
    position: 'absolute',
    left: 0,
    top: 7,
    width: 12,
    height: 2,
    backgroundColor: WHITE,
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: WHITE,
  },
});

export default styles;
