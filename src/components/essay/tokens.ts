/** Shared by the long-form pages (the essay, the sandbox studies). */
export const SANS = "'Geist', ui-sans-serif, system-ui, sans-serif"

/** Adaptive ink from the theme's primary token — dark on light bg, light on dark. */
export const ink = (opacity: number) =>
  `color-mix(in oklch, var(--color-primary) ${opacity}%, transparent)`
