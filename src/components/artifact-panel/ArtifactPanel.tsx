import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from 'motion/react'
import { EASE_UI, PANEL_SPRING } from '../../revolut-card/motionTokens'
import { ensureReady } from '@web-kits/audio'
import { panelClose, panelOpen, tick } from '@/lib/sounds'
import {
  MAX_SIDE_WIDTH,
  MIN_SIDE_WIDTH,
  PANEL_MARGIN,
  type ArtifactPanelState,
  type Dock,
  type Rect,
} from './useArtifactPanel'
import { STUDIO_PAD, STUDIO_RADIUS } from './studio'

/** The drag stays smooth; an audible tick marks every notch of this many px —
 * the web's stand-in for a slider's haptic detents. */
const TICK_PX = 40
/** Floor between ticks so a fast fling doesn't turn into a buzz. */
const TICK_MIN_MS = 28

const SANS = "'Geist', ui-sans-serif, system-ui, sans-serif"

/** The centred view is a window, not a true viewport takeover. */
const FULL_MAX_WIDTH = 1080
const FULL_MAX_HEIGHT = 720
const FULL_MARGIN = 48

const PANEL_RADIUS = 20
/** Height of the slim "open in the panel" bar the inline figure collapses to. */
const BAR_H = 48
/** Essay spacing: room above the figure and below it; the slim bar sits closer,
 * pulling into whatever follows's own top margin. */
const ESSAY_SPACING = { top: 40, bottom: 40, bottomOpen: -40 }

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return {
    left: lerp(a.left, b.left, t),
    top: lerp(a.top, b.top, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
  }
}

function rectOf(r: DOMRect): Rect {
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

function insetRect(r: Rect, d: number): Rect {
  return applyInsets(r, { l: d, t: d, r: d, b: d })
}

type Insets = { l: number; t: number; r: number; b: number }

/** How far `inner` sits in from each edge of `outer`. */
function insetsOf(outer: Rect, inner: Rect): Insets {
  return {
    l: inner.left - outer.left,
    t: inner.top - outer.top,
    r: outer.left + outer.width - (inner.left + inner.width),
    b: outer.top + outer.height - (inner.top + inner.height),
  }
}

function applyInsets(r: Rect, i: Insets): Rect {
  return {
    left: r.left + i.l,
    top: r.top + i.t,
    width: r.width - i.l - i.r,
    height: r.height - i.t - i.b,
  }
}

function onScreen(r: DOMRect): boolean {
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
}

/** A lift between the inline slot and the panel, as the content sees it. */
export type Flight = {
  toPanel: boolean
  /** Reversing a flight that hadn't landed yet. */
  midFlight: boolean
  /** The inline slot's live rect (it moves while the figure collapses/expands). */
  slotRect: () => Rect | null
}

/**
 * A Claude-style artifact panel: the content lives inline in the page, and an
 * "Open panel" button lifts it into a panel that docks left, right or centred.
 * The content is rendered once into a detached node that is physically moved
 * between the inline slot and the panel body — never duplicated, never
 * remounted — so live content (a WebGPU canvas, say) survives every move.
 */
export function ArtifactPanel({
  panel,
  children,
  inlineAspect = '16 / 10',
  inlineFrame = { pad: STUDIO_PAD, radius: STUDIO_RADIUS },
  inlineNote = 'Open in the panel.',
  spacing = ESSAY_SPACING,
  onDockChange,
  onFlight,
  onLand,
}: {
  panel: ArtifactPanelState
  children: ReactNode
  /** Aspect ratio of the inline slot, as CSS. */
  inlineAspect?: string
  /** The frame the content draws around itself inline: how far in from the slot
   * its inner surface sits, and that surface's corner radius. The panel shrinks
   * onto it when closing. Defaults to ArtifactStudio's. */
  inlineFrame?: { pad: number; radius: number }
  /** Shown in the slim bar the inline slot collapses to while the panel is open. */
  inlineNote?: string
  /** Margins around the inline figure (px): above, below, and below while it's
   * collapsed to the bar. */
  spacing?: { top: number; bottom: number; bottomOpen: number }
  /** Reports the current dock, the px it reserves on that edge, and whether the
   * page should animate the change (false while resizing, or with reduced motion). */
  onDockChange?: (dock: Dock | null, reserve: number, animated: boolean) => void
  /** Called as the content lifts off between inline and panel; returns a step
   * run every frame of the flight with its progress, 0 → 1. */
  onFlight?: (flight: Flight) => (t: number) => void
  /** The flight has landed. */
  onLand?: () => void
}) {
  const {
    dock,
    lastDock,
    canPanel,
    setDock,
    viewport: vp,
    sideWidth: sideW,
    setSideWidth,
    resizing,
    setResizing,
    windowResizing,
  } = panel
  // Derived here rather than read off `panel` so TypeScript narrows `dock` with it.
  const open = dock !== null
  const [menuOpen, setMenuOpen] = useState(false)
  const [inlineHost, setInlineHost] = useState<HTMLDivElement | null>(null)
  const instant = resizing || windowResizing
  // Reduced motion: nothing slides or springs — the panel fades, the rest snaps.
  const reduced = useReducedMotion() ?? false

  const [panelHost, setPanelHost] = useState<HTMLDivElement | null>(null)
  // Stable home for the content. Portalling straight into whichever host is
  // active would remount it (new GPU context, lost state) on every open/close.
  const [contentNode] = useState(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.style.cssText = 'position:absolute;inset:0'
    return el
  })

  // Between hosts the content rides a fixed layer above everything (see the
  // flight effect below); otherwise it's in the panel while open, inline when closed.
  const [flying, setFlying] = useState(false)
  const flyingRef = useRef(false)
  const flightLayerRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const host = open ? panelHost : inlineHost

  // Opening and closing are the visitor's choices, so they get a sound;
  // re-docking an open panel stays quiet.
  const openPanel = () => {
    panelOpen()
    setDock(lastDock)
  }
  const closePanel = () => {
    panelClose()
    setDock(null)
  }

  const M = PANEL_MARGIN
  const sideDocked = dock === 'left' || dock === 'right'

  const geom = (d: Dock): Rect => {
    switch (d) {
      case 'right':
        return {
          left: vp.w - sideW - M,
          top: M,
          width: sideW,
          height: vp.h - 2 * M,
        }
      case 'left':
        return { left: M, top: M, width: sideW, height: vp.h - 2 * M }
      case 'full': {
        const width = Math.max(0, Math.min(FULL_MAX_WIDTH, vp.w - 2 * FULL_MARGIN))
        const height = Math.max(0, Math.min(FULL_MAX_HEIGHT, vp.h - 2 * FULL_MARGIN))
        return { left: (vp.w - width) / 2, top: (vp.h - height) / 2, width, height }
      }
    }
  }

  // Translation that parks a docked panel just off its edge (enter from / exit
  // to). A transform, so sliding in and out never re-lays out the panel.
  const offscreen = (d: Dock): { x: number; y: number } => {
    const g = geom(d)
    switch (d) {
      case 'right':
        return { x: vp.w + M - g.left, y: 0 }
      case 'left':
        return { x: -(g.left + g.width + M), y: 0 }
      case 'full':
        // Rises from / sinks below the bottom edge, like the side panels slide.
        return { x: 0, y: vp.h + M - g.top }
    }
  }

  const content = contentNode
    ? createPortal(
        <>
          {children}
          <AnimatePresence initial={false}>
            {canPanel && !open && (
              <motion.button
                type="button"
                onClick={openPanel}
                className="btn-press absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] tracking-[0.02em] text-white/75 backdrop-blur-sm hover:text-white"
                style={{
                  fontFamily: SANS,
                  background: 'rgba(18,18,18,0.6)',
                }}
                // Rides the content, so it sits above the panel while landing and shows
                // as the content arrives. Out at once as the panel takes over.
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.2, delay: reduced ? 0 : 0.25, ease: EASE_UI },
                }}
                exit={{ opacity: 0, transition: { duration: 0.1, ease: EASE_UI } }}
              >
                <ExpandIcon />
                Open panel
              </motion.button>
            )}
          </AnimatePresence>
        </>,
        contentNode,
      )
    : null

  // Shared-element flight: on open/close the panel and the content move as one.
  // The panel grows out of the inline figure into its dock (or shrinks back onto
  // the content's inline frame), and the content rides inside it on the fixed
  // layer, easing between its inline placement and the panel body. Both follow
  // this one spring and the content is placed relative to the panel, so they can
  // never come apart. Only worth it when the figure is on screen; otherwise it
  // just swaps and the panel slides.
  const flightRef = useRef<AnimationPlaybackControls | null>(null)
  const prevOpenRef = useRef(open)
  // Read live by the flight, so re-docking mid-flight retargets it.
  const dockRectRef = useRef<() => Rect>(() => geom(lastDock))
  dockRectRef.current = () => geom(dock ?? lastDock)
  useLayoutEffect(() => {
    if (prevOpenRef.current === open) return
    prevOpenRef.current = open
    const layer = flightLayerRef.current
    const slot = slotRef.current
    const panelEl = panelRef.current
    if (!contentNode || !layer || !slot || !panelEl || !panelHost) return
    if (reduced || (!flyingRef.current && !onScreen(slot.getBoundingClientRect()))) return

    // Measure before re-parenting — mid-flight, this picks up from where it is.
    const from = contentNode.getBoundingClientRect()
    const panelFrom: Rect =
      open && !flyingRef.current
        ? rectOf(slot.getBoundingClientRect())
        : {
            left: panelLeft.get(),
            top: panelTop.get(),
            width: panelWidth.get(),
            height: panelHeight.get(),
          }
    const panelTo = () =>
      open
        ? dockRectRef.current()
        : insetRect(rectOf(slot.getBoundingClientRect()), inlineFrame.pad)
    const radiusFrom = panelRadius.get()
    const radiusTo = open ? PANEL_RADIUS : inlineFrame.radius
    // The content as insets within the panel: from wherever it is now, to the
    // panel body (open) or to the slot, just outside the frame the panel lands on.
    const insetsFrom = insetsOf(panelFrom, from)
    const pad = inlineFrame.pad
    const insetsTo = open
      ? insetsOf(panelEl.getBoundingClientRect(), panelHost.getBoundingClientRect())
      : { l: -pad, t: -pad, r: -pad, b: -pad }
    const contentStep = onFlight?.({
      toPanel: open,
      midFlight: flyingRef.current,
      slotRect: () => (slotRef.current ? rectOf(slotRef.current.getBoundingClientRect()) : null),
    })

    flightRef.current?.stop()
    flyingRef.current = true
    setFlying(true)

    const place = (r: Rect) => {
      layer.style.left = `${r.left}px`
      layer.style.top = `${r.top}px`
      layer.style.width = `${r.width}px`
      layer.style.height = `${r.height}px`
    }
    // `jump`, not `set`: it also stops the spring Motion starts on these values.
    const step = (t: number) => {
      const p = lerpRect(panelFrom, panelTo(), t)
      jumpPanel({ ...p, x: 0, y: 0 })
      panelRadius.jump(lerp(radiusFrom, radiusTo, t))
      place(
        applyInsets(p, {
          l: lerp(insetsFrom.l, insetsTo.l, t),
          t: lerp(insetsFrom.t, insetsTo.t, t),
          r: lerp(insetsFrom.r, insetsTo.r, t),
          b: lerp(insetsFrom.b, insetsTo.b, t),
        }),
      )
      contentStep?.(t)
    }
    step(0)
    layer.appendChild(contentNode)

    flightRef.current = animate(0, 1, {
      ...PANEL_SPRING,
      onUpdate: step,
      onComplete: () => {
        flyingRef.current = false
        flightRef.current = null
        setFlying(false)
        onLand?.()
        // Landed inline: park the panel off its edge again, ready to slide in.
        if (!open) {
          jumpPanel({ ...geom(lastDock), ...offscreen(lastDock) })
          panelRadius.jump(PANEL_RADIUS)
        }
      },
    })
    // Geometry helpers are recreated each render; the flight only cares about
    // their values at the moment `open` flips.
  }, [open])

  useEffect(() => () => flightRef.current?.stop(), [])

  // Settle into the resting host whenever not in flight.
  useLayoutEffect(() => {
    if (flyingRef.current) return
    if (contentNode && host && contentNode.parentElement !== host) host.appendChild(contentNode)
  }, [contentNode, host, flying])

  const active = (d: Dock) => dock === d

  // Space the page should reserve on the docked edge.
  const reserve = sideDocked ? sideW + 2 * M : 0

  // Layout effect + no animation on the first report, so the page is already
  // shifted aside on first paint instead of gliding over on load.
  const reportedRef = useRef(false)
  useLayoutEffect(() => {
    onDockChange?.(dock, reserve, !instant && !reduced && reportedRef.current)
    reportedRef.current = true
  }, [dock, reserve, instant, reduced, onDockChange])

  // Drag the inner edge of a side dock to resize its width (clamped, horizontal only).
  const startResize = (e: React.PointerEvent) => {
    if (!sideDocked) return
    e.preventDefault()
    const startX = e.clientX
    const startW = sideW
    const sign = dock === 'right' ? -1 : 1
    const notchOf = (w: number) => Math.round((w - MIN_SIDE_WIDTH) / TICK_PX)
    let notch = notchOf(startW)
    let lastTickAt = 0
    // Audio needs a user gesture to start — this pointerdown is it.
    void ensureReady()
    setResizing(true)
    // Hold the grabbing cursor even when the pointer outruns the thin handle.
    const prevCursor = document.body.style.cursor
    document.body.style.cursor = 'grabbing'
    const onMove = (ev: PointerEvent) => {
      const next = Math.max(
        MIN_SIDE_WIDTH,
        Math.min(MAX_SIDE_WIDTH, startW + sign * (ev.clientX - startX)),
      )
      setSideWidth(next)
      const now = performance.now()
      if (notchOf(next) !== notch && now - lastTickAt >= TICK_MIN_MS) {
        notch = notchOf(next)
        lastTickAt = now
        tick()
      }
    }
    const onUp = () => {
      setResizing(false)
      document.body.style.cursor = prevCursor
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // When open, sit at the docked geometry. When closed, rest just off the last
  // edge so the panel can spring back in on reopen — or, with reduced motion,
  // stay in place and fade. (A flight overrides this frame by frame.)
  const panelAnimate = open
    ? { ...geom(dock), x: 0, y: 0, opacity: 1 }
    : reduced
      ? { ...geom(lastDock), x: 0, y: 0, opacity: 0 }
      : { ...geom(lastDock), ...offscreen(lastDock), opacity: 1 }

  // Explicit motion values so the flight can drive the panel frame by frame;
  // the rest of the time `animate` springs them as usual.
  const panelLeft = useMotionValue(panelAnimate.left)
  const panelTop = useMotionValue(panelAnimate.top)
  const panelWidth = useMotionValue(panelAnimate.width)
  const panelHeight = useMotionValue(panelAnimate.height)
  const panelX = useMotionValue(panelAnimate.x)
  const panelY = useMotionValue(panelAnimate.y)
  const panelRadius = useMotionValue(PANEL_RADIUS)
  const jumpPanel = (r: Rect & { x: number; y: number }) => {
    panelLeft.jump(r.left)
    panelTop.jump(r.top)
    panelWidth.jump(r.width)
    panelHeight.jump(r.height)
    panelX.jump(r.x)
    panelY.jump(r.y)
  }
  const panelTransition = instant
    ? { duration: 0 }
    : reduced
      ? { duration: 0, opacity: { duration: 0.2, ease: EASE_UI } }
      : PANEL_SPRING

  return (
    <>
      {/* Inline slot — the landing spot for the content, collapsing to a slim note
          while it's in the panel. The height springs with the flight, so the page
          below glides instead of jumping. */}
      <figure className="w-full" style={{ marginTop: spacing.top }}>
        <motion.div
          className="relative w-full overflow-hidden"
          animate={{
            height: open ? BAR_H : 'auto',
            marginBottom: open ? spacing.bottomOpen : spacing.bottom,
          }}
          transition={reduced ? { duration: 0 } : PANEL_SPRING}
          initial={false}
        >
          <div ref={slotRef} className="relative w-full" style={{ aspectRatio: inlineAspect }}>
            <div ref={setInlineHost} className="absolute inset-0" />
          </div>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 text-[13px] tracking-[-0.01em]"
                style={{
                  height: BAR_H,
                  fontFamily: SANS,
                  color: 'color-mix(in oklch, var(--color-primary) 50%, transparent)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                <span>{inlineNote}</span>
                <button
                  type="button"
                  onClick={closePanel}
                  className="btn-press shrink-0 rounded-full px-3 py-1 text-[12px]"
                  style={{
                    color: 'color-mix(in oklch, var(--color-primary) 75%, transparent)',
                    background: 'color-mix(in oklch, var(--color-primary) 7%, transparent)',
                  }}
                >
                  Show inline
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </figure>

      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-50">
            <motion.div
              ref={panelRef}
              className="absolute flex flex-col overflow-hidden"
              style={{
                left: panelLeft,
                top: panelTop,
                width: panelWidth,
                height: panelHeight,
                x: panelX,
                y: panelY,
                pointerEvents: open ? 'auto' : 'none',
                borderRadius: panelRadius,
                background:
                  'radial-gradient(ellipse 90% 70% at 50% 40%, #0b0b0d 0%, #060607 72%, #030304 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              animate={panelAnimate}
              transition={panelTransition}
              initial={false}
              aria-hidden={!open}
            >
              <PanelHeader
                active={active}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                setDock={setDock}
                onClose={closePanel}
                reduced={reduced}
              />
              {/* Content fills the body; the panel's geometry decides its size. */}
              <div ref={setPanelHost} className="relative min-h-0 flex-1 mx-2 mb-2" />

              {sideDocked && (
                <button
                  type="button"
                  aria-label="Resize panel width"
                  onPointerDown={startResize}
                  className="absolute inset-y-0 z-10 w-2.5 cursor-grab active:cursor-grabbing"
                  style={
                    {
                      [dock === 'right' ? 'left' : 'right']: -1,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className="absolute inset-y-0 my-auto h-10 w-1 rounded-full"
                    style={
                      {
                        [dock === 'right' ? 'left' : 'right']: 3,
                        background: 'rgba(255,255,255,0.18)',
                      } as React.CSSProperties
                    }
                  />
                </button>
              )}
            </motion.div>
          </div>,
          document.body,
        )}

      {typeof document !== 'undefined' &&
        createPortal(
          // The content's ride between homes — above the panel, never interactive.
          <div ref={flightLayerRef} className="pointer-events-none fixed z-[60]" aria-hidden />,
          document.body,
        )}

      {content}
    </>
  )
}

function PanelHeader({
  active,
  menuOpen,
  setMenuOpen,
  setDock,
  onClose,
  reduced,
}: {
  active: (d: Dock) => boolean
  menuOpen: boolean
  setMenuOpen: (v: boolean | ((p: boolean) => boolean)) => void
  setDock: (d: Dock | null) => void
  onClose: () => void
  reduced: boolean
}) {
  return (
    <div className="relative flex shrink-0 items-center justify-end gap-1 px-2 py-2">
      <DockMenu
        active={active}
        open={menuOpen}
        setOpen={setMenuOpen}
        setDock={setDock}
        reduced={reduced}
      />
      <HeaderButton label="Close" onClick={onClose}>
        <CloseIcon />
      </HeaderButton>
    </div>
  )
}

function DockMenu({
  active,
  open,
  setOpen,
  setDock,
  reduced,
}: {
  active: (d: Dock) => boolean
  open: boolean
  setOpen: (v: boolean | ((p: boolean) => boolean)) => void
  setDock: (d: Dock | null) => void
  reduced: boolean
}) {
  const pick = (d: Dock) => {
    setDock(d)
    setOpen(false)
  }
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }
  return (
    <div className="relative">
      <HeaderButton label="Window options" active={open} onClick={() => setOpen((v) => !v)}>
        <LayoutIcon />
      </HeaderButton>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute right-0 top-full z-10 mt-1.5 rounded-xl p-1.5"
              // Grows out of the trigger it hangs from.
              style={{ background: 'rgba(20,20,22,0.96)', transformOrigin: 'top right' }}
              initial={hidden}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={hidden}
              transition={{ duration: 0.16, ease: EASE_UI }}
            >
              <div className="flex gap-1">
                <DockCell d="left" label="Dock left" active={active('left')} onClick={pick}>
                  <ArrowIcon deg={270} />
                </DockCell>
                <DockCell d="full" label="Centred view" active={active('full')} onClick={pick}>
                  <FullIcon />
                </DockCell>
                <DockCell d="right" label="Dock right" active={active('right')} onClick={pick}>
                  <ArrowIcon deg={90} />
                </DockCell>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function DockCell({
  d,
  label,
  active,
  onClick,
  children,
}: {
  d: Dock
  label: string
  active: boolean
  onClick: (d: Dock) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={() => onClick(d)}
      className="btn-press flex size-8 items-center justify-center rounded-md"
      style={{
        // Solid grey for the same reason as the header icons — no alpha build-up
        // where the arrow's strokes meet.
        color: active ? '#111' : '#B8B8BD',
        background: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </button>
  )
}

function HeaderButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="btn-press flex size-7 items-center justify-center rounded-md hover:bg-white/8"
      style={{
        // Solid grey, not translucent white: overlapping stroke segments (joins,
        // the X's crossing) double up alpha and show as darker/brighter spots.
        color: active ? '#fff' : '#8E8E93',
        // Left unset when inactive so the hover background can show.
        background: active ? 'rgba(255,255,255,0.12)' : undefined,
      }}
    >
      {children}
    </button>
  )
}

/* — icons (16px, currentColor) — */

function ExpandIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function LayoutIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
    </svg>
  )
}

function FullIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

/** Arrow pointing `deg` clockwise from up. */
function ArrowIcon({ deg: rot }: { deg: number }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}
