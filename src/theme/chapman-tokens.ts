// src/theme/chapman-tokens.ts
export const tokens = {
  colors: {
    // Core palette - premium dark base (adjustable later)
    bg: {
      primary: '#0a0a0f',    // Deep background
      secondary: '#111118',  // Cards, sidebar
      tertiary: '#181824',   // Hover states
    },
    text: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
      muted: '#71717a',
    },
    accent: {
      primary: '#6366f1',    // Indigo - your brand color
      primaryHover: '#4f46e5',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    border: {
      subtle: 'rgba(255,255,255,0.08)',
      default: 'rgba(255,255,255,0.12)',
    }
  },
  radius: {
    sm: '6px',
    md: '10px', 
    lg: '16px',
    xl: '24px',
  },
  shadow: {
    card: '0 4px 24px -1px rgba(0,0,0,0.25)',
    elevated: '0 8px 40px -4px rgba(0,0,0,0.35)',
    glow: '0 0 0 1px rgba(99,102,241,0.3)',
  },
  transition: {
    default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'all 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  }
} as const;

export type Token = typeof tokens;