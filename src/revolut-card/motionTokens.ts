import { spring } from 'motion/react'

/** The panel, the card's flight, the inline figure and the essay shift all move
 * on this one spring, so nothing drifts apart while they settle. */
export const PANEL_SPRING = { type: 'spring', duration: 0.55, bounce: 0.18 } as const

/** PANEL_SPRING as a CSS `<duration> linear(…)` value, for the essay's CSS
 * transitions. Motion's spring generator takes its duration in ms. */
export const PANEL_SPRING_CSS = String(
  spring({ keyframes: [0, 1], duration: PANEL_SPRING.duration * 1000, bounce: PANEL_SPRING.bounce }),
)

/** Strong ease-out for small UI (popovers, fades) — mirrors `--ease-ui` in index.css. */
export const EASE_UI = [0.23, 1, 0.32, 1] as const
