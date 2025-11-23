import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = width > 768;
const isDesktop = width > 992;

const styles = StyleSheet.create({
  homepage: {
    minHeight: '100vh',
    flex: 1,
  },
  heroSection: {
    paddingVertical: 100,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 15,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#212529',
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 40,
    textAlign: 'center',
  },
  searchBar: {
    maxWidth: 900,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignSelf: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 10,
      },
    }),
  },
  searchRow: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 8,
  },
  searchInput: {
    flex: isTablet ? 1 : undefined,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    minHeight: 48,
    color: '#212529',
  },
  searchButton: {
    backgroundColor: '#0d6efd',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...(isTablet ? {} : { width: '100%' }),
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  featuresTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#212529',
  },
  featuresRow: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    flex: isDesktop ? 1 : isTablet ? 0.48 : 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 24,
    alignItems: 'center',
    minWidth: isTablet ? 200 : '100%',
    ...Platform.select({
      web: {
        transition: 'transform 0.3s, box-shadow 0.3s',
      },
    }),
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#212529',
  },
  featureDesc: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  statsSection: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#0d6efd',
  },
  statsRow: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: isTablet ? 0 : 24,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 18,
    color: '#ffffff',
  },
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212529',
  },
  ctaSubtitle: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#0d6efd',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#212529',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 'auto',
  },
  footerRow: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isTablet ? 'center' : 'flex-start',
    gap: 16,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 16,
    color: '#6c757d',
  },
  footerCopyright: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: isTablet ? 'right' : 'left',
  },
});

export default styles;

