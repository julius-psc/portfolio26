import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { albedoToDataUrl, bakeFaceMaps } from '../../revolut-card/faceMaps'
import { isMobileLike, startRevolutCard } from '../../revolut-card/start'
import { EASE_UI } from '../../revolut-card/motionTokens'
import { ArtifactStudio } from '../artifact-panel/ArtifactStudio'

/** Live WebGPU card inside a compact rounded dark studio frame. */
export function LiveCardArtifact({
  fill,
  orientation,
  cardPx,
  framed = true,
}: {
  /** Share of the frame the card fills on its tighter axis; renderer default if unset. */
  fill?: number
  /** Force the card upright or flat; unset lets the renderer decide from the frame. */
  orientation?: 'portrait' | 'landscape'
  /** Lock the card's long edge to this many CSS px (overrides `fill`). A getter is
   * read every frame — for values that change faster than React should re-render. */
  cardPx?: number | (() => number | undefined)
  /** Dashed outline around the studio — for the page; the panel is its own frame. */
  framed?: boolean
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fillRef = useRef(fill)
  fillRef.current = fill
  const orientationRef = useRef(orientation)
  orientationRef.current = orientation
  const cardPxRef = useRef(cardPx)
  cardPxRef.current = cardPx
  const [lightsOn, setLightsOn] = useState(true)
  const lightsOnRef = useRef(lightsOn)
  lightsOnRef.current = lightsOn

  const [unsupported, setUnsupported] = useState(false)
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null)
  const [tiltPrompt, setTiltPrompt] = useState<(() => Promise<boolean>) | null>(null)
  const [tiltEnabled, setTiltEnabled] = useState(false)
  const [tiltDenied, setTiltDenied] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return startRevolutCard(canvas, {
      variant: 'embed',
      getLightsOn: () => lightsOnRef.current,
      getFill: () => fillRef.current,
      getOrientation: () => orientationRef.current,
      getCardPx: () => {
        const px = cardPxRef.current
        return typeof px === 'function' ? px() : px
      },
      onUnsupported: () => {
        setUnsupported(true)
        void bakeFaceMaps()
          .then((maps) => setFallbackSrc(albedoToDataUrl(maps.albedo)))
          .catch(() => setFallbackSrc(null))
      },
      onOrientationPermissionNeeded: (request) => {
        setTiltPrompt(() => request)
      },
    })
  }, [])

  const enableTilt = async () => {
    if (!tiltPrompt) return
    const ok = await tiltPrompt()
    if (ok) {
      setTiltEnabled(true)
      setTiltPrompt(null)
    } else {
      setTiltDenied(true)
      setTiltPrompt(null)
    }
  }

  const mobile = typeof window !== 'undefined' && isMobileLike()

  return (
    <ArtifactStudio framed={framed}>
      <canvas
        ref={canvasRef}
        tabIndex={unsupported ? -1 : 0}
        className={`absolute inset-0 h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-inset ${
          unsupported ? 'invisible' : ''
        }`}
        aria-hidden={unsupported}
        aria-label="Live Revolut chrome card. Move over the frame to tilt."
      />

      {unsupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5">
          {/* The baked face fades in over its grey placeholder instead of popping. */}
          <div className="relative w-[78%]" style={{ aspectRatio: '85.6 / 53.98' }}>
            <div className="absolute inset-0 rounded-[4.2%] bg-neutral-800" />
            {fallbackSrc && (
              <motion.img
                src={fallbackSrc}
                alt="Revolut metal card face"
                className="absolute inset-0 h-full w-full rounded-[4.2%] shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: EASE_UI }}
              />
            )}
          </div>
          <p className="max-w-[16rem] text-center text-[11px] leading-relaxed tracking-[0.02em] text-white/40">
            Needs WebGPU — flat still shown instead.
          </p>
        </div>
      )}

      {!unsupported && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 pb-3">
          <AnimatePresence initial={false}>
            {tiltPrompt && !tiltEnabled && (
              <motion.button
                type="button"
                onClick={() => void enableTilt()}
                className="pointer-events-auto rounded-full px-3 py-1 text-[10px] tracking-[0.04em] text-white/70"
                style={{
                  background: 'rgba(18, 18, 18, 0.75)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset',
                }}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: EASE_UI }}
              >
                Enable tilt
              </motion.button>
            )}
          </AnimatePresence>
          {tiltDenied && mobile && (
            <p className="text-[10px] tracking-[0.04em] text-white/35">Drag to tilt</p>
          )}
          <div
            className="pointer-events-auto flex items-center gap-5 rounded-full py-1 pl-3 pr-1"
            style={{
              background: 'rgba(18, 18, 18, 0.75)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 20px rgba(0,0,0,0.4)',
            }}
          >
            <span className="pl-0.5 text-[10px] tracking-[0.04em] text-white/45">
              Studio light
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={lightsOn}
              aria-label={lightsOn ? 'Turn studio light off' : 'Turn studio light on'}
              onClick={() => setLightsOn((v) => !v)}
              className="btn-press relative h-5 w-9 shrink-0 rounded-full"
              style={{
                background: lightsOn
                  ? 'rgba(255,255,255,0.92)'
                  : 'rgba(255,255,255,0.14)',
                transitionProperty: 'background-color',
                transitionDuration: '0.2s',
                transitionTimingFunction: 'var(--ease-ui)',
              }}
            >
              <motion.span
                className="absolute top-0.5 left-0.5 block size-4 rounded-full"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
                animate={{
                  x: lightsOn ? 16 : 0,
                  backgroundColor: lightsOn ? '#111111' : 'rgba(255,255,255,0.88)',
                }}
                transition={{
                  type: 'spring',
                  duration: 0.35,
                  bounce: 0,
                  backgroundColor: { duration: 0.2, ease: EASE_UI },
                }}
                initial={false}
              />
            </button>
          </div>
        </div>
      )}
    </ArtifactStudio>
  )
}
