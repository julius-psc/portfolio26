import { defineSound } from '@web-kits/audio'

/*
 * The portfolio's sound palette. Each one only confirms something the visitor
 * chose to do, sits well under the page (felt more than heard), and is over in
 * a blink. Sine tones get a few ms of attack so they start without a click.
 * Links, hovers and scrolling stay silent on purpose.
 */

/** Resize detent on the artifact panel's edge — the web's stand-in for a
 * slider's haptic notches. */
export const tick = defineSound({
  source: { type: 'triangle', frequency: { start: 2000, end: 1300 } },
  envelope: { decay: 0.015 },
  gain: 0.025,
})

/** An artifact lifts into its panel: a short glide up. */
export const panelOpen = defineSound({
  source: { type: 'sine', frequency: { start: 480, end: 720 } },
  envelope: { attack: 0.004, decay: 0.11 },
  gain: 0.035,
})

/** …and settles back into the page: the same glide, down. */
export const panelClose = defineSound({
  source: { type: 'sine', frequency: { start: 720, end: 480 } },
  envelope: { attack: 0.004, decay: 0.1 },
  gain: 0.03,
})

/** Email copied: two quick notes a fifth apart — "done". */
export const copied = defineSound({
  layers: [
    {
      source: { type: 'sine', frequency: 1175 },
      envelope: { attack: 0.002, decay: 0.08 },
      gain: 0.022,
    },
    {
      source: { type: 'sine', frequency: 1760 },
      envelope: { attack: 0.002, decay: 0.12 },
      gain: 0.022,
      delay: 0.07,
    },
  ],
})

/** Studio light switch: a dry click, a touch brighter turning on. */
export const switchOn = defineSound({
  source: { type: 'noise' },
  filter: { type: 'bandpass', frequency: 3200, resonance: 2 },
  envelope: { decay: 0.018 },
  gain: 0.08,
})

export const switchOff = defineSound({
  source: { type: 'noise' },
  filter: { type: 'bandpass', frequency: 2200, resonance: 2 },
  envelope: { decay: 0.018 },
  gain: 0.08,
})

/** Avatar slingshot released: an elastic flick up as the page changes mode. */
export const slingshot = defineSound({
  source: { type: 'sine', frequency: { start: 220, end: 880 } },
  envelope: { attack: 0.002, decay: 0.14 },
  gain: 0.04,
})
