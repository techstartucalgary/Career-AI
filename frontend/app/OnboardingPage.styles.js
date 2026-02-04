import { StyleSheet, Platform } from 'react-native';
import { THEME } from '../src/styles/theme';

const { colors: COLORS } = THEME;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    borderColor: COLORS.borderLight,
    backgroundColor: 'transparent',
  },
  stepIndicatorActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px rgba(167, 139, 250, 0.6)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  stepIndicatorCompleted: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
});

export default styles;



