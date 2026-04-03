import { StyleSheet } from 'react-native';
import { THEME } from '../styles/theme';

const { primary } = THEME.colors;

/** Resume / Cover Letter — job-posting card (native only) */
export default StyleSheet.create({
  iconJobDoc: {
    width: 36,
    height: 44,
    borderRadius: 5,
    borderWidth: 2.5,
    borderColor: primary,
    position: 'absolute',
    top: 6,
    left: 2,
  },
  iconJobLine1: {
    position: 'absolute',
    top: 18,
    left: 8,
    width: 24,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: primary,
  },
  iconJobLine2: {
    position: 'absolute',
    top: 24,
    left: 8,
    width: 18,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: primary,
  },
  iconJobLine3: {
    position: 'absolute',
    top: 30,
    left: 8,
    width: 22,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: primary,
  },
  iconSparkleDot: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: primary,
  },
});
