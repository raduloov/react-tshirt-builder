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
/**
 * Hook for detecting viewport breakpoints and responsive state.
 * Uses matchMedia for efficient breakpoint detection.
 */
export declare function useResponsive(config?: ResponsiveConfig): ResponsiveState;
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
export declare function useScaledDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number, enabled?: boolean): ScaledDimensions;
