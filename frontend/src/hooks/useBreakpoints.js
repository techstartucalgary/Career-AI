import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Aligns with LandingPage / JobsExplore static breakpoints */
export const BREAKPOINT_MD = 768;
export const BREAKPOINT_LG = 992;

/**
 * Live viewport width + breakpoint flags for responsive layout (esp. mobile web).
 */
export function useBreakpoints() {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isMobile = width < BREAKPOINT_MD;
    const isTablet = width >= BREAKPOINT_MD && width < BREAKPOINT_LG;
    const isDesktop = width >= BREAKPOINT_LG;
    /** Wide enough for multi-column web layouts (pricing staircase, payment sidebar) */
    const isWideLayout = width >= BREAKPOINT_MD;

    return {
      width,
      isMobile,
      isTablet,
      isDesktop,
      isWideLayout,
    };
  }, [width]);
}
