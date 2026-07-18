import { squircleClip } from '../../lib/squircle'
import { surface, border } from '../../lib/aurora-tokens'

// ─── Constants ────────────────────────────────────────────────────────────────

export const SCROLL_W = 402
export const SCROLL_H = 1100
const RADIUS          = 49
const SMOOTHING       = 0.6

const clip = squircleClip({ width: SCROLL_W, height: SCROLL_H, cornerRadius: RADIUS, cornerSmoothing: SMOOTHING })

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrollableScreenProps {
  children?: React.ReactNode
  style?: React.CSSProperties
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScrollableScreen({ children, style }: ScrollableScreenProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: SCROLL_W,
        height: SCROLL_H,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Border ring */}
      <div
        aria-hidden
        style={{
          ...clip,
          position: 'absolute',
          inset: 0,
          background: border.default,
        }}
      />

      {/* Scrollable content surface */}
      <div
        className="hide-scrollbar"
        style={{
          ...clip,
          position: 'absolute',
          inset: '0.5px',
          backgroundColor: surface.base,
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}
