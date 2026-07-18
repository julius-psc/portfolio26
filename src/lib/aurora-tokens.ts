// ─── AUR0RA Design System ──────────────────────────────────────────────────────
// Primitives → Semantics → Layout
// Source: Figma variable set "Primitives" + "Semantics" (Mode 1)

// ─── Primitives ───────────────────────────────────────────────────────────────

export const primitive = {
  orange: {
    500: '#F86405',
    600: '#EA7B0C',
  },
  neutral: {
    100: '#F2EEE8',
    400: '#A39B91',
    450: '#86868B',
    900: '#17140F',
    950: '#0E0C0B',
  },
  white: {
    alpha06: 'rgba(255, 252, 248, 0.06)',
    alpha08: 'rgba(255, 255, 255, 0.08)',
  },
  black: {
    alpha40: 'rgba(0, 0, 0, 0.40)',
    alpha60: 'rgba(14, 12, 11, 0.60)',
  },
} as const

// ─── Semantic tokens ──────────────────────────────────────────────────────────

export const surface = {
  base:      primitive.neutral[950],          // #0E0C0B
  elevated:  primitive.neutral[900],          // #17140F
  glass:     primitive.white.alpha06,         // rgba(255,252,248, 0.06)
  glassDark: primitive.black.alpha60,         // rgba(14,12,11, 0.60)
} as const

export const text = {
  primary:   primitive.neutral[100],          // #F2EEE8
  secondary: primitive.neutral[400],          // #A39B91
  accent:    primitive.orange[500],           // #F86405
  muted:     primitive.neutral[450],          // #86868B
  inverse:   primitive.neutral[950],          // #0E0C0B
} as const

export const border = {
  default: primitive.white.alpha08,           // rgba(255,255,255, 0.08)
  glass:   primitive.white.alpha08,           // rgba(255,255,255, 0.08)
} as const

export const accent = {
  primary:       primitive.orange[500],       // #F86405
  pressed:       primitive.orange[600],       // #EA7B0C
  gradientStart: primitive.orange[500],       // #F86405
  gradientEnd:   primitive.orange[600],       // #EA7B0C
  gradient:      `linear-gradient(135deg, ${primitive.orange[500]}, ${primitive.orange[600]})`,
} as const

export const overlay = {
  scrim: primitive.black.alpha40,             // rgba(0,0,0, 0.40)
} as const

// ─── Radius ───────────────────────────────────────────────────────────────────

export const radius = {
  xs:   8,
  sm:   12,
  md:   18,
  lg:   24,
  pill: 999,
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  4:  4,
  8:  8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
  80: 80,
  96: 96,
} as const

// ─── Convenience re-export ────────────────────────────────────────────────────

const aurora = { primitive, surface, text, border, accent, overlay, radius, spacing }
export default aurora
