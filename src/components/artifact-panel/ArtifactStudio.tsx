import type { ReactNode } from 'react'
import { STUDIO_PAD, STUDIO_RADIUS } from './studio'

const OUTER_RADIUS = STUDIO_RADIUS + STUDIO_PAD

/** Dark rounded studio an artifact sits in, ringed by a dashed outline while
 * it's inline on the page. Inner radius + padding = outer radius (concentric). */
export function ArtifactStudio({
  framed = true,
  children,
}: {
  /** Dashed outline around the studio — for the page; the panel is its own frame. */
  framed?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative h-full w-full">
      <div
        className="relative h-full w-full"
        style={{
          borderRadius: OUTER_RADIUS,
          padding: STUDIO_PAD,
        }}
      >
        {/* Gone at once when the panel lifts the artifact; eases back in late in
            the landing, so it settles around the studio rather than popping. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 border border-dashed"
          style={{
            borderRadius: OUTER_RADIUS,
            borderColor: 'color-mix(in oklch, var(--color-primary) 20%, transparent)',
            opacity: framed ? 1 : 0,
            transition: framed ? 'opacity 0.3s var(--ease-ui) 0.25s' : 'none',
          }}
        />
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            borderRadius: STUDIO_RADIUS,
            background:
              'radial-gradient(ellipse 70% 55% at 50% 48%, #0a0a0b 0%, #050505 70%, #030303 100%)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
