/**
 * Official brand colors for OAuth providers and other brand elements
 * These are intentional brand-specific colors and should not be changed
 */

export const BRAND_COLORS = {
  // Google OAuth branding colors (official)
  GOOGLE: {
    BLUE: '#4285F4',
    GREEN: '#34A853',
    YELLOW: '#FBBC05',
    RED: '#EA4335',
  },
  // Logger console colors for browser dev tools
  LOGGER: {
    DEBUG: '#77828D',
    INFO: '#1389FD',
    WARN: '#FFDB6C',
    ERROR: '#EE4744',
  },
  // Avatar generation
  AVATAR: {
    FALLBACK: '8b5cf6', // Purple - matches design system accent
  },
  // Terminal readonly mode
  TERMINAL: {
    READONLY_CURSOR: '#00000000', // Transparent cursor
  },
} as const;
