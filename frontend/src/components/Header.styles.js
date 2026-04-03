import { StyleSheet, Platform } from 'react-native';
import { THEME } from '../styles/theme';

const { colors: COLORS } = THEME;

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    overflow: 'visible',
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
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  /** Equal flex with right column so center links sit in true horizontal center */
  navLeftZone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  /** Logged-in desktop: only as wide as links; sides stay balanced */
  navCenterZone: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Mobile / logged-out: grows so logo + actions stay at edges */
  navCenterZoneFlex: {
    flex: 1,
    minWidth: 0,
  },
  accountMenuWrap: {
    position: 'relative',
    zIndex: 1002,
    flexShrink: 0,
    ...Platform.select({
      web: {
        marginRight: -20,
      },
      default: {
        marginRight: -12,
      },
    }),
  },
  accountMenuTriggerActive: {
    borderColor: 'rgba(167, 139, 250, 0.55)',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  accountDropdown: {
    position: 'absolute',
    right: 0,
    left: 'auto',
    top: '100%',
    marginTop: 8,
    minWidth: 200,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  accountDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  accountDropdownItemText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  accountDropdownDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  navRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: 0,
  },
  menuIconButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  /** Desktop account menu: circular profile photo or initials */
  accountMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  accountAvatarImage: {
    width: '100%',
    height: '100%',
  },
  accountAvatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  menuIcon: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  mobileMenu: {
    ...Platform.select({
      web: {
        position: 'absolute',
        right: 16,
        left: 'auto',
        top: '100%',
        width: 280,
        maxWidth: 'min(320px, calc(100vw - 32px))',
        marginTop: 6,
        zIndex: 1001,
        boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
      },
      default: {
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
      },
    }),
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mobileMenuDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  mobileMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  mobileMenuText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  mobileMenuTextActive: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
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
    flexWrap: 'wrap',
    justifyContent: 'center',
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
});

export default styles;
