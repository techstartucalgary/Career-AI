import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 15,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logo: {
    textDecorationLine: 'none',
  },
  logoText: {
    marginBottom: 0,
    fontWeight: 'bold',
    color: '#0d6efd',
    fontSize: 24,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 16,
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  navLink: {
    color: '#212529',
    fontWeight: '500',
    fontSize: 16,
    textDecorationLine: 'none',
  },
  navLinkHover: {
    color: '#0d6efd',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0d6efd',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#0d6efd',
    borderColor: '#0d6efd',
  },
  buttonText: {
    color: '#0d6efd',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
});

export default styles;

