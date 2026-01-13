import { useState, useEffect, useCallback, useMemo } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveState {
  /** Current breakpoint: mobile (<640px), tablet (640-1024px), desktop (>1024px) */
  breakpoint: Breakpoint;
  /** True when viewport is mobile (<640px) */
  isMobile: boolean;
  /** True when viewport is tablet (640-1024px) */
  isTablet: boolean;
  /** True when viewport is desktop (>1024px) */
  isDesktop: boolean;
  /** Current viewport width in pixels */
  viewportWidth: number;
  /** Current viewport height in pixels */
  viewportHeight: number;
  /** True when device is in portrait orientation */
  isPortrait: boolean;
  /** True when device is in landscape orientation */
  isLandscape: boolean;
}

export interface ResponsiveConfig {
  /** Mobile breakpoint max width (default: 639px) */
  mobileBreakpoint?: number;
  /** Tablet breakpoint max width (default: 1024px) */
  tabletBreakpoint?: number;
  /** Enable/disable responsive behavior */
  enabled?: boolean;
}

const DEFAULT_CONFIG: Required<ResponsiveConfig> = {
  mobileBreakpoint: 639,
  tabletBreakpoint: 1024,
  enabled: true,
};

/**
 * Hook for detecting viewport breakpoints and responsive state.
 * Uses matchMedia for efficient breakpoint detection.
 */
export function useResponsive(config?: ResponsiveConfig): ResponsiveState {
  const { mobileBreakpoint, tabletBreakpoint, enabled } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const getBreakpoint = useCallback((width: number): Breakpoint => {
    if (width <= mobileBreakpoint) return 'mobile';
    if (width <= tabletBreakpoint) return 'tablet';
    return 'desktop';
  }, [mobileBreakpoint, tabletBreakpoint]);

  const getInitialState = useCallback((): ResponsiveState => {
    // SSR safety - default to desktop if window not available
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        viewportWidth: 1200,
        viewportHeight: 800,
        isPortrait: false,
        isLandscape: true,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    return {
      breakpoint,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      viewportWidth: width,
      viewportHeight: height,
      isPortrait: height > width,
      isLandscape: width >= height,
    };
  }, [getBreakpoint]);

  const [state, setState] = useState<ResponsiveState>(getInitialState);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Create media queries for breakpoints
    const mobileQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    const tabletQuery = window.matchMedia(`(max-width: ${tabletBreakpoint}px)`);
    const portraitQuery = window.matchMedia('(orientation: portrait)');

    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = getBreakpoint(width);

      setState({
        breakpoint,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop',
        viewportWidth: width,
        viewportHeight: height,
        isPortrait: height > width,
        isLandscape: width >= height,
      });
    };

    // Use matchMedia change events for breakpoint changes
    const handleMediaChange = () => updateState();

    // Also listen to resize for viewport dimensions
    const handleResize = () => updateState();

    // Add listeners
    mobileQuery.addEventListener('change', handleMediaChange);
    tabletQuery.addEventListener('change', handleMediaChange);
    portraitQuery.addEventListener('change', handleMediaChange);
    window.addEventListener('resize', handleResize);

    // Initial update
    updateState();

    return () => {
      mobileQuery.removeEventListener('change', handleMediaChange);
      tabletQuery.removeEventListener('change', handleMediaChange);
      portraitQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, mobileBreakpoint, tabletBreakpoint, getBreakpoint]);

  return state;
}

export interface ScaledDimensions {
  /** Scaled width in pixels */
  width: number;
  /** Scaled height in pixels */
  height: number;
  /** Scale factor applied (1 = original size) */
  scale: number;
}

/**
 * Calculate scaled dimensions to fit within a container while maintaining aspect ratio.
 */
export function useScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  enabled: boolean = true
): ScaledDimensions {
  return useMemo(() => {
    if (!enabled) {
      return { width: originalWidth, height: originalHeight, scale: 1 };
    }

    const widthScale = maxWidth / originalWidth;
    const heightScale = maxHeight / originalHeight;
    const scale = Math.min(widthScale, heightScale, 1); // Never scale up

    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
      scale,
    };
  }, [originalWidth, originalHeight, maxWidth, maxHeight, enabled]);
}
