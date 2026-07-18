import { squircleClip } from '../../lib/squircle'
import { surface, border } from '../../lib/aurora-tokens'
import StatusBar      from './StatusBar'
import DynamicIsland, { type IslandState } from './DynamicIsland'
import HomeIndicator  from './HomeIndicator'

// ─── Constants ────────────────────────────────────────────────────────────────

export const FRAME_W   = 402
export const FRAME_H   = 874
const RADIUS           = 49
const SMOOTHING        = 0.6

const clip = squircleClip({ width: FRAME_W, height: FRAME_H, cornerRadius: RADIUS, cornerSmoothing: SMOOTHING })

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhoneFrameProps {
  children?: React.ReactNode
  style?: React.CSSProperties
  surfaceRef?: React.RefCallback<HTMLDivElement>
  islandState?: IslandState
}

// ─── Component ────────────────────────────────────────────────────────────────
// Shell layout (always present):
//   StatusBar → DynamicIsland → [children content, flex-1] → HomeIndicator

export default function PhoneFrame({ children, style, surfaceRef, islandState }: PhoneFrameProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: FRAME_W,
        height: FRAME_H,
        flexShrink: 0,
        backgroundColor: surface.base,
        borderRadius: RADIUS,
        ...style,
      }}
    >
      {/* Border ring — squircle for the smooth device silhouette */}
      <div
        aria-hidden
        style={{
          ...clip,
          position: 'absolute',
          inset: 0,
          background: border.default,
        }}
      />

      {/* Content surface — borderRadius + overflow:hidden is GPU-reliable,
          avoids clip-path paint-layer artifacts during child animations */}
      <div
        ref={surfaceRef}
        style={{
          position: 'absolute',
          inset: '0.5px',
          borderRadius: RADIUS - 0.5,
          backgroundColor: surface.base,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          isolation: 'isolate',
        }}
      >
        {/* Screen content slot — fills full height, content scrolls behind the status bar */}
        <div
          style={{
            flex: 1,
            alignSelf: 'stretch',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>

        <HomeIndicator />

        {/* Status bar — absolute overlay, no background, pointerEvents:none so touches pass through */}
        <div
          style={{
            position:      'absolute',
            top:           18,
            left:          0,
            right:         0,
            zIndex:        20,
            pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'relative' }}>
            <StatusBar expanded={islandState !== 'idle'} />
            <div
              style={{
                position:       'absolute',
                inset:          0,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                pointerEvents:  'none',
              }}
            >
              <DynamicIsland state={islandState} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
