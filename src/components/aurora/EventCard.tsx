import { motion } from 'motion/react'
import { squircleClip } from '../../lib/squircle'
import { surface, border, radius } from '../../lib/aurora-tokens'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_W       = 326
const DEFAULT_CARD_H  = 383
const DEFAULT_PANEL_H = 303
const SMOOTHING       = 0.6
const CORNER          = radius.md  // 18

const LAYOUT_SPRING = { type: 'spring', stiffness: 140, damping: 22, mass: 1.2 } as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventCardProps {
  children?: React.ReactNode
  backdrop:       string
  cardWidth?:     number
  cardHeight?:    number
  panelHeight?:   number
  animated?:      boolean
  backdropHeight?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventCard({
  children,
  backdrop,
  cardWidth     = DEFAULT_W,
  cardHeight    = DEFAULT_CARD_H,
  panelHeight   = DEFAULT_PANEL_H,
  animated      = false,
  backdropHeight,
}: EventCardProps) {

  // ── Animated mode — layout-driven resize, no squircle clip ─────────────────
  if (animated) {
    const backdropPad = backdropHeight ?? (cardHeight - panelHeight)

    return (
      <motion.div
        layout
        transition={LAYOUT_SPRING}
        style={{
          position:     'relative',
          width:        cardWidth,
          paddingTop:   backdropPad,
          borderRadius: CORNER,
          background:   surface.base,
          flexShrink:   0,
          overflow:     'hidden',
        }}
      >
        <img
          src={backdrop} alt="" aria-hidden
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center', opacity: 0.5,
          }}
        />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.20)' }} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, borderRadius: CORNER,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', pointerEvents: 'none',
        }} />

        {/* Glass panel — auto-height, shrinks/grows with children */}
        <motion.div
          layout
          transition={LAYOUT_SPRING}
          style={{
            position:             'relative',
            padding:              '20px 16px',
            display:              'flex',
            flexDirection:        'column',
            gap:                  0,
            alignSelf:            'stretch',
            borderRadius:         `${CORNER}px ${CORNER}px 0 0`,
            border:               `1px solid ${border.glass}`,
            background:           'rgba(14,12,11,0.50)',
            backdropFilter:       'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    )
  }

  // ── Static mode — squircle clips, fixed heights ─────────────────────────────
  const outerClip = squircleClip({ width: cardWidth, height: cardHeight,  cornerRadius: CORNER, cornerSmoothing: SMOOTHING })
  const innerClip = squircleClip({ width: cardWidth, height: panelHeight, cornerRadius: CORNER, cornerSmoothing: SMOOTHING })

  return (
    <div
      style={{
        ...outerClip,
        position:       'relative',
        width:          cardWidth,
        height:         cardHeight,
        background:     surface.base,
        flexShrink:     0,
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'flex-end',
        alignItems:     'center',
      }}
    >
      <img
        src={backdrop} alt="" aria-hidden
        style={{
          position:       'absolute',
          inset:          0,
          width:          '100%',
          height:         '100%',
          objectFit:      'cover',
          objectPosition: 'center',
          opacity:        0.5,
        }}
      />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.20)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: CORNER, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', pointerEvents: 'none' }} />

      <div
        style={{
          ...innerClip,
          position:             'relative',
          display:              'flex',
          height:               panelHeight,
          padding:              '20px 16px',
          flexDirection:        'column',
          justifyContent:       'space-between',
          alignItems:           'flex-start',
          flexShrink:           0,
          alignSelf:            'stretch',
          border:               `1px solid ${border.glass}`,
          background:           'rgba(14,12,11,0.50)',
          backdropFilter:       'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
