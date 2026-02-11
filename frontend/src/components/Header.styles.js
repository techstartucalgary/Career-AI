import { StyleSheet, Platform } from 'react-native';
import { THEME } from '../styles/theme';

const { colors: COLORS } = THEME;

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
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
  logoImage: {
    height: 40,
    width: 150,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStar: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
    transform: [{ rotate: '45deg' }],
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
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
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  navLinkActive: {
    textDecorationLine: 'underline',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: 'transparent',
  },
  messagesButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.textPrimary,
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
    borderLeftColor: COLORS.textPrimary,
  },
});

export default styles;
