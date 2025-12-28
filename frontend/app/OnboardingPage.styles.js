import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1C2F',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Platform.OS === 'web' ? 40 : 24,
    paddingTop: 100,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  stepIndicator: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#8B7AB8',
    backgroundColor: 'transparent',
  },
  stepIndicatorActive: {
    backgroundColor: '#A78BFA',
    borderColor: '#A78BFA',
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px rgba(167, 139, 250, 0.6)',
      },
      default: {
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  stepIndicatorCompleted: {
    backgroundColor: '#8B7AB8',
    borderColor: '#8B7AB8',
  },
});

export default styles;

