/**
 * Animation Configuration & Constants
 *
 * Centralized animation durations, easing functions, and presets
 * to ensure consistent animation patterns across the application.
 *
 * All animations use the ANIMATION_DURATIONS constants to maintain
 * performance and provide a unified visual feel.
 *
 * @see docs/FRONTEND_UI_RULES.md for animation guidelines
 */

// ============================================================================
// ANIMATION DURATIONS (milliseconds)
// ============================================================================

/**
 * Standard animation duration constants used throughout the application.
 * Keep animations fast and snappy (≤300ms) for better perceived performance.
 */
export const ANIMATION_DURATIONS = {
  /** Fast animations for quick interactions (dropdowns, quick feedback) */
  FAST: 100,

  /** Standard duration for most transitions (default for hover, collapse) */
  STANDARD: 200,

  /** Slow animations for emphasis and modal reveals */
  SLOW: 300,

  /** Deprecated: Use STANDARD instead of 500ms animations (feels sluggish) */
  SLUGGISH: 500,
} as const;

// ============================================================================
// ANIMATION EASING FUNCTIONS
// ============================================================================

/**
 * Easing functions for animations.
 * These map to CSS easing values used in Tailwind transitions.
 */
export const ANIMATION_EASING = {
  /** No acceleration (constant speed throughout) */
  LINEAR: 'linear',

  /** Smooth ease-in-out (best for most transitions) */
  IN_OUT: 'ease-in-out',

  /** Ease-out (starts fast, ends slow - snappy, appears responsive) */
  OUT: 'ease-out',

  /** Ease-in (starts slow, ends fast) */
  IN: 'ease-in',
} as const;

// ============================================================================
// ANIMATION PRESETS (Component-level)
// ============================================================================

/**
 * Pre-configured animation presets for common component animations.
 * Each preset includes the Tailwind class and duration for reference.
 *
 * Usage:
 * ```tsx
 * className={`${ANIMATIONS.SIDEBAR_COLLAPSE.class}`}
 * ```
 */
export const ANIMATIONS = {
  /**
   * Sidebar collapse/expand animation
   * Duration: 200ms, smooth width transition
   * Use for: Toggling sidebar width on collapse button
   */
  SIDEBAR_COLLAPSE: {
    class: 'transition-[width] duration-200 ease-linear',
    duration: ANIMATION_DURATIONS.STANDARD,
  },

  /**
   * Dropdown menu open/close animation
   * Duration: 100ms, snappy fade and scale
   * Use for: Opening dropdown menus, select dropdowns
   */
  DROPDOWN: {
    class: 'transition-all duration-100 ease-out',
    duration: ANIMATION_DURATIONS.FAST,
  },

  /**
   * Modal open/close animation
   * Duration: 200ms, smooth fade and scale
   * Use for: Modal enters, dialog opens
   */
  MODAL: {
    class: 'transition-all duration-200 ease-in-out',
    duration: ANIMATION_DURATIONS.STANDARD,
  },

  /**
   * Hover state color transition
   * Duration: 200ms, smooth color change
   * Use for: Button hover, menu item hover, link hover
   */
  HOVER_STATE: {
    class: 'transition-colors duration-200',
    duration: ANIMATION_DURATIONS.STANDARD,
  },

  /**
   * Badge appear/disappear animation
   * Duration: 100ms, quick fade
   * Use for: Status badge updates, coming-soon badges
   */
  BADGE: {
    class: 'transition-opacity duration-100',
    duration: ANIMATION_DURATIONS.FAST,
  },

  /**
   * Loading spinner rotation
   * Duration: 1000ms, continuous rotation
   * Use for: Loading indicators, spinners
   */
  SPINNER: {
    class: 'animate-spin',
    duration: 1000, // Full rotation cycle
  },

  /**
   * Focus ring transition
   * Duration: 150ms, smooth focus indicator
   * Use for: Input focus, button focus, interactive element focus
   */
  FOCUS_RING: {
    class: 'transition-shadow duration-150',
    duration: 150,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert milliseconds to CSS seconds value
 * @param ms Duration in milliseconds
 * @returns Duration string for use in CSS (e.g., "0.2s")
 */
export const msToSeconds = (ms: number): string => {
  return `${ms / 1000}s`;
};

/**
 * Get animation style object from duration constant
 * @param duration Duration value from ANIMATION_DURATIONS
 * @returns Object with style properties for inline animation
 */
export const getAnimationStyle = (duration: number) => ({
  transitionDuration: msToSeconds(duration),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type for animation duration keys */
export type AnimationDuration = typeof ANIMATION_DURATIONS[keyof typeof ANIMATION_DURATIONS];

/** Type for easing function keys */
export type AnimationEasing = typeof ANIMATION_EASING[keyof typeof ANIMATION_EASING];

/** Type for animation preset keys */
export type AnimationPreset = keyof typeof ANIMATIONS;
