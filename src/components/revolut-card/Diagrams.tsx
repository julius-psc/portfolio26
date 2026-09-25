import { useId, useState, type ReactNode } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useSpring } from 'motion/react'

const SANS = "'Geist', ui-sans-serif, system-ui, sans-serif"

/** Adaptive ink from the theme's primary token — for the captions on the page. */
const ink = (opacity: number) =>
  `color-mix(in oklch, var(--color-primary) ${opacity}%, transparent)`

/** Drawing ink. Figures sit in the card's dark studio in both themes, so they draw
 * in light, the way the room would light them. */
const lite = (opacity: number) => `rgba(255,255,255,${opacity / 100})`

/** The studio's black, as in the card's frame. */
const STUDIO = '#0a0a0b'
const STUDIO_FILL =
  'radial-gradient(ellipse 70% 55% at 50% 48%, #0a0a0b 0%, #050505 70%, #030303 100%)'

/** Softboxes around the room, as [from, to] in degrees (0 = right, 90 = straight up). */
const SOFTBOXES: readonly [number, number][] = [
  [44, 56],
  [80, 90],
]

/** Tilt the figures follow: mass like the card, but settling rather than bouncing. */
const TILT_SPRING = { stiffness: 170, damping: 22, mass: 0.6 }

const rad = (deg: number) => (deg * Math.PI) / 180

/** Point at `deg` / `r` from (cx, cy), in SVG space (y down). */
function polar(cx: number, cy: number, r: number, deg: number) {
  return { x: cx + r * Math.cos(rad(deg)), y: cy - r * Math.sin(rad(deg)) }
}

/** SVG arc path between two angles, counter-clockwise on screen. */
function arc(cx: number, cy: number, r: number, a: number, b: number) {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const p = polar(cx, cy, r, lo)
  const q = polar(cx, cy, r, hi)
  return `M ${p.x} ${p.y} A ${r} ${r} 0 ${hi - lo > 180 ? 1 : 0} 0 ${q.x} ${q.y}`
}

function inSoftbox(deg: number) {
  return SOFTBOXES.some(([a, b]) => deg >= a && deg <= b)
}

/** A pointer-driven tilt on a spring (snapping under reduced motion). */
function useTilt(max: number) {
  const reduced = useReducedMotion() ?? false
  const spring = useSpring(0, TILT_SPRING)
  const [value, setValue] = useState(0)
  useMotionValueEvent(spring, 'change', setValue)
  const aim = (v: number) => {
    const clamped = Math.max(-max, Math.min(max, v))
    if (reduced) spring.jump(clamped)
    else spring.set(clamped)
  }
  /** Props for the element the pointer and arrow keys tilt. */
  const bind = {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      aim(((e.clientX - r.left) / r.width - 0.5) * 2 * max)
    },
    onPointerLeave: () => aim(0),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Home' || e.key === 'Escape') aim(0)
      const step = e.key === 'ArrowRight' ? 2 : e.key === 'ArrowLeft' ? -2 : 0
      if (!step) return
      e.preventDefault()
      aim(spring.get() + step)
    },
  }
  return { value, bind }
}

/** The card's inline frame — dashed outline, studio inset 8px — with a caption below. */
function Figure({
  n,
  caption,
  children,
}: {
  n: number
  caption: ReactNode
  children: ReactNode
}) {
  return (
    <figure className="my-8">
      <div className="relative rounded-[20px] p-2">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[20px] border border-dashed"
          style={{ borderColor: ink(20) }}
        />
        <div className="relative overflow-hidden rounded-xl" style={{ background: STUDIO_FILL }}>
          {children}
        </div>
      </div>
      <figcaption
        className="mt-3 px-1 text-[13px] leading-relaxed tracking-[-0.01em]"
        style={{ fontFamily: SANS, color: ink(45), textWrap: 'pretty' }}
      >
        <span className="font-medium" style={{ color: ink(55) }}>
          Fig. {n}
        </span>{' '}
        {caption}
      </figcaption>
    </figure>
  )
}

/** Tilt surface: a slider for assistive tech, a pointer pad for everyone else. */
function TiltPad({
  label,
  value,
  max,
  valueText,
  bind,
  children,
}: {
  label: string
  value: number
  max: number
  valueText: string
  bind: ReturnType<typeof useTilt>['bind']
  children: ReactNode
}) {
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={-max}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-valuetext={valueText}
      className="cursor-ew-resize touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/20"
      {...bind}
    >
      {children}
    </div>
  )
}

/** Same pill as the card's "Studio light" control, pinned to the figure's bottom. */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  const id = useId()
  const reduced = useReducedMotion() ?? false
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3">
      <div
        role="radiogroup"
        aria-label={label}
        className="flex gap-0.5 rounded-full p-1"
        style={{
          background: 'rgba(18, 18, 18, 0.75)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 20px rgba(0,0,0,0.4)',
        }}
      >
        {options.map((o) => {
          const active = o.id === value
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.id)}
              className="btn-press relative rounded-full px-3 py-1 text-[10px] tracking-[0.04em]"
              style={{ fontFamily: SANS, color: active ? '#111' : 'rgba(255,255,255,0.45)' }}
            >
              {active && (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.92)' }}
                  transition={
                    reduced ? { duration: 0 } : { type: 'spring', duration: 0.3, bounce: 0 }
                  }
                />
              )}
              <span className="relative">{o.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Label({
  x,
  y,
  children,
  strong = false,
  anchor = 'middle',
}: {
  x: number
  y: number
  children: ReactNode
  strong?: boolean
  anchor?: 'start' | 'middle' | 'end'
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      style={{
        fontFamily: SANS,
        fontSize: strong ? 13 : 11,
        fontWeight: strong ? 500 : 400,
        letterSpacing: strong ? '-0.01em' : '0.02em',
        fill: strong ? lite(85) : lite(40),
      }}
    >
      {children}
    </text>
  )
}

function Ray({
  from,
  deg,
  length,
  opacity,
  dashed = false,
}: {
  from: { x: number; y: number }
  deg: number
  length: number
  opacity: number
  dashed?: boolean
}) {
  const to = polar(from.x, from.y, length, deg)
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeDasharray={dashed ? '2 4' : undefined}
      style={{ stroke: lite(opacity) }}
    />
  )
}

/** The room: a dotted arc, its softboxes glowing on it. */
function Room({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <path
        d={arc(cx, cy, r, 8, 172)}
        fill="none"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeDasharray="0 5"
        style={{ stroke: lite(28) }}
      />
      {SOFTBOXES.map(([a, b]) => (
        <path
          key={a}
          d={arc(cx, cy, r, a, b)}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          style={{ stroke: lite(92) }}
        />
      ))}
    </g>
  )
}

/** The card edge-on, and the point on it being shaded. */
function Surface({ x, y, deg = 0, half = 120 }: { x: number; y: number; deg?: number; half?: number }) {
  const a = polar(x, y, -half, deg)
  const b = polar(x, y, half, deg)
  return (
    <g>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        strokeWidth={4}
        strokeLinecap="round"
        style={{ stroke: lite(70) }}
      />
      <circle cx={x} cy={y} r={3} fill={STUDIO} strokeWidth={1.5} style={{ stroke: lite(90) }} />
    </g>
  )
}

/* — The parallax tell — */

const MAX_TILT = 18
/** Where the eye sits, as a direction from the surface point. */
const VIEW_DEG = 130

/**
 * Tilt the card by θ and R = reflect(V, N) swings by 2θ, racing across the room
 * twice as fast as the surface turns.
 */
export function ParallaxDiagram({ n }: { n: number }) {
  const { value: theta, bind } = useTilt(MAX_TILT)

  const W = 600
  const H = 290
  const P = { x: W / 2, y: 250 }
  const ROOM_R = 200

  const normalDeg = 90 + theta
  // Mirror V about N: the angle to N is the same on both sides.
  const reflectDeg = 2 * normalDeg - VIEW_DEG
  const restReflectDeg = 2 * 90 - VIEW_DEG
  const hit = polar(P.x, P.y, ROOM_R, reflectDeg)
  const lit = inSoftbox(reflectDeg)
  const eye = polar(P.x, P.y, 170, VIEW_DEG)
  const tilted = Math.abs(theta) > 0.5

  return (
    <Figure
      n={n}
      caption={
        <>
          Move across it to tilt the card. <strong>V</strong> runs to your eye,{' '}
          <strong>N</strong> straight out of the card, and <strong>R</strong> is V mirrored
          about N. Turn the card by θ and R turns by 2θ, so the softbox races off the face.
        </>
      }
    >
      <TiltPad
        label="Card tilt"
        value={theta}
        max={MAX_TILT}
        valueText={`Card tilted ${Math.round(theta)} degrees, reflection swung ${Math.round(2 * theta)} degrees`}
        bind={bind}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
          <Room cx={P.x} cy={P.y} r={ROOM_R} />
          <Label {...polar(P.x, P.y, ROOM_R + 22, 50)} anchor="start">
            softbox
          </Label>

          {/* Where things were before the tilt, and by how much they moved. */}
          {tilted && (
            <g>
              <Ray from={P} deg={90} length={96} opacity={20} dashed />
              <Ray from={P} deg={restReflectDeg} length={ROOM_R} opacity={20} dashed />
              <path
                d={arc(P.x, P.y, 56, 90, normalDeg)}
                fill="none"
                strokeWidth={1.25}
                style={{ stroke: lite(50) }}
              />
              <Label {...polar(P.x, P.y, 72, 90 + theta / 2)}>θ</Label>
              <path
                d={arc(P.x, P.y, ROOM_R - 24, restReflectDeg, reflectDeg)}
                fill="none"
                strokeWidth={1.25}
                style={{ stroke: lite(50) }}
              />
              <Label {...polar(P.x, P.y, ROOM_R - 42, restReflectDeg + theta)}>2θ</Label>
            </g>
          )}

          <Ray from={P} deg={VIEW_DEG} length={158} opacity={45} />
          <circle cx={eye.x} cy={eye.y} r={7} fill="none" strokeWidth={1.25} style={{ stroke: lite(55) }} />
          <circle cx={eye.x} cy={eye.y} r={2.25} style={{ fill: lite(75) }} />
          <Label {...polar(P.x, P.y, 118, VIEW_DEG + 8)} strong>
            V
          </Label>

          <Ray from={P} deg={normalDeg} length={96} opacity={65} />
          <Label {...polar(P.x, P.y, 110, normalDeg)} strong>
            N
          </Label>

          {/* R brightens when it lands on a softbox: that's the pixel lighting up. */}
          <Ray from={P} deg={reflectDeg} length={ROOM_R} opacity={lit ? 90 : 55} />
          <Label {...polar(P.x, P.y, 128, reflectDeg - 7)} strong>
            R
          </Label>
          <circle
            cx={hit.x}
            cy={hit.y}
            r={lit ? 6 : 4}
            strokeWidth={1.5}
            style={{ fill: lit ? '#fff' : STUDIO, stroke: lite(90) }}
          />

          <Surface x={P.x} y={P.y} deg={theta} />
        </svg>
      </TiltPad>
    </Figure>
  )
}

/* — Roughness is blur — */

const FINISHES = [
  { id: 'face', label: 'Face', spread: 2 },
  { id: 'chip', label: 'Chip', spread: 9 },
  { id: 'etched', label: 'Etched', spread: 24 },
] as const
type Finish = (typeof FINISHES)[number]['id']

/** Where this pixel's R points — dead centre of the first softbox. */
const SAMPLE_DEG = 50
/** Room angles the unrolled strips span, left to right. */
const STRIP_FROM = 170
const STRIP_TO = 10

/**
 * Roughness widens the cone of the room one pixel gathers. Same room, same
 * softbox: the strips show it read sharp, or read soft — never darker.
 */
export function RoughnessDiagram({ n }: { n: number }) {
  const id = useId()
  const reduced = useReducedMotion() ?? false
  const [finish, setFinish] = useState<Finish>('face')
  const spreadMv = useSpring(FINISHES[0].spread, { stiffness: 220, damping: 26 })
  const [spread, setSpread] = useState<number>(FINISHES[0].spread)
  useMotionValueEvent(spreadMv, 'change', setSpread)

  const choose = (next: Finish) => {
    setFinish(next)
    const to = FINISHES.find((f) => f.id === next)!.spread
    if (reduced) spreadMv.jump(to)
    else spreadMv.set(to)
  }

  const W = 600
  const P = { x: W / 2, y: 200 }
  const ROOM_R = 168
  const STRIP_X = 64
  const STRIP_W = W - 2 * STRIP_X
  const STRIP_H = 16
  const ROOM_Y = 232
  const SEEN_Y = 264
  const H = SEEN_Y + STRIP_H + 64 // room for the finish switch

  const xOf = (deg: number) => STRIP_X + ((STRIP_FROM - deg) / (STRIP_FROM - STRIP_TO)) * STRIP_W
  const a = polar(P.x, P.y, ROOM_R, SAMPLE_DEG - spread)
  const b = polar(P.x, P.y, ROOM_R, SAMPLE_DEG + spread)
  const cone = `M ${P.x} ${P.y} L ${a.x} ${a.y} A ${ROOM_R} ${ROOM_R} 0 0 0 ${b.x} ${b.y} Z`
  // Blur the unrolled room by the cone's width: that's all roughness does.
  const blurPx = (spread / (STRIP_FROM - STRIP_TO)) * STRIP_W * 0.5

  // Blur inside the clip, so only the softboxes soften — not the strip's edges.
  const strip = (y: number, clip: string, blurred: boolean) => (
    <g clipPath={`url(#${id}-${clip})`}>
      <g filter={blurred ? `url(#${id}-blur)` : undefined}>
        <rect x={STRIP_X - 40} y={y - 10} width={STRIP_W + 80} height={STRIP_H + 20} fill={STUDIO} />
        {SOFTBOXES.map(([from, to]) => (
          <rect
            key={from}
            x={xOf(to)}
            y={y - 10}
            width={xOf(from) - xOf(to)}
            height={STRIP_H + 20}
            fill="#fff"
          />
        ))}
      </g>
    </g>
  )
  const outline = (y: number) => (
    <rect
      x={STRIP_X}
      y={y}
      width={STRIP_W}
      height={STRIP_H}
      rx={5}
      fill="none"
      strokeWidth={1}
      style={{ stroke: lite(14) }}
    />
  )

  return (
    <Figure
      n={n}
      caption={
        <>
          Each finish gathers a wider cone of the same room. Below, the room unrolled flat,
          and the room as this pixel sees it: rougher reads softer, never darker.
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
        <defs>
          <clipPath id={`${id}-room`}>
            <rect x={STRIP_X} y={ROOM_Y} width={STRIP_W} height={STRIP_H} rx={5} />
          </clipPath>
          <clipPath id={`${id}-seen`}>
            <rect x={STRIP_X} y={SEEN_Y} width={STRIP_W} height={STRIP_H} rx={5} />
          </clipPath>
          <filter id={`${id}-blur`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation={`${blurPx} 0`} />
          </filter>
        </defs>

        <Room cx={P.x} cy={P.y} r={ROOM_R} />
        <path d={cone} style={{ fill: lite(8), stroke: lite(30) }} strokeWidth={1} />
        <Ray from={P} deg={SAMPLE_DEG} length={ROOM_R} opacity={85} />
        <Label {...polar(P.x, P.y, 100, SAMPLE_DEG + 8)} strong>
          R
        </Label>
        <Surface x={P.x} y={P.y} />

        {strip(ROOM_Y, 'room', false)}
        {outline(ROOM_Y)}
        {/* The slice of the room the cone covers. */}
        <rect
          x={xOf(SAMPLE_DEG + spread)}
          y={ROOM_Y - 3}
          width={xOf(SAMPLE_DEG - spread) - xOf(SAMPLE_DEG + spread)}
          height={STRIP_H + 6}
          rx={4}
          fill="none"
          strokeWidth={1.25}
          style={{ stroke: lite(75) }}
        />
        <Label x={STRIP_X - 12} y={ROOM_Y + STRIP_H / 2} anchor="end">
          room
        </Label>

        {strip(SEEN_Y, 'seen', true)}
        {outline(SEEN_Y)}
        <Label x={STRIP_X - 12} y={SEEN_Y + STRIP_H / 2} anchor="end">
          seen
        </Label>
      </svg>

      <Segmented label="Surface finish" options={FINISHES} value={finish} onChange={choose} />
    </Figure>
  )
}

/* — Thin film — */

/** Coating: refractive index and thickness (a clear, silica-like layer). */
const FILM_N = 1.5
const FILM_NM = 420
/** Light's angle onto the card at rest, and how far tilting swings it either way:
 * near head-on to near grazing, so one sweep runs the whole way round the hues. */
const REST_INCIDENCE = 42
const FILM_TILT = 38

/** Extra distance path 2 travels through the coating (nm), at an incidence angle. */
function extraPath(incidence: number) {
  const sinT = Math.sin(rad(incidence)) / FILM_N
  return 2 * FILM_N * FILM_NM * Math.sqrt(1 - sinT * sinT)
}

/** How much of a wavelength survives: 1 when the two paths return in step, 0 when
 * they cancel. (Both reflections flip phase, so whole wavelengths line up.) */
function survives(extra: number, nm: number) {
  return 0.5 + 0.5 * Math.cos((2 * Math.PI * extra) / nm)
}

/** The colour you see: the three bands, each as much as survives, mixed — so the
 * swatch always agrees with the bars beside it. */
function filmColour(extra: number): string {
  const c = [survives(extra, 650), survives(extra, 550), survives(extra, 450)]
  // Lift saturation so small shifts read as hue.
  const grey = (c[0] + c[1] + c[2]) / 3
  const out = c.map((v) => Math.max(0, Math.min(1, grey + (v - grey) * 1.4)) ** 0.8)
  return `rgb(${out.map((v) => Math.round(v * 255)).join(',')})`
}

/** One wavelength per row, drawn at its own (scaled) wavelength. */
const BANDS = [
  { nm: 450, name: 'blue', colour: '#6f9bff' },
  { nm: 550, name: 'green', colour: '#5fd68a' },
  { nm: 650, name: 'red', colour: '#ff6b6b' },
] as const

/** A sine across [x0, x0 + w] at baseline y, `px` per cycle, shifted by `phase`. */
function wave(x0: number, y: number, w: number, px: number, amp: number, phase: number) {
  const pts: string[] = []
  for (let i = 0; i <= 64; i++) {
    const x = x0 + (w * i) / 64
    const v = y - amp * Math.sin((2 * Math.PI * (x - x0)) / px + phase)
    pts.push(`${x.toFixed(1)},${v.toFixed(1)}`)
  }
  return pts.join(' ')
}

/**
 * Light splits at the coating: path 1 bounces off its top, path 2 dips through to
 * the steel and back. Per colour, that extra distance lands the two returning waves
 * in step (the colour survives) or out of step (it cancels). Tilt shifts them all.
 */
export function ThinFilmDiagram({ n }: { n: number }) {
  const { value: tilt, bind } = useTilt(FILM_TILT)
  // Tilting the card changes the angle light meets it at.
  const incidence = REST_INCIDENCE + tilt
  const extra = extraPath(incidence)

  const W = 600
  const H = 250

  // — Left: the coating in cross-section. —
  const X0 = 28
  const X1 = 284
  const TOP = 168
  const FILM = 26 // drawn thick — the real one is a few hundred nanometres
  const STEEL = 22
  const inDeg = 90 + incidence
  const outDeg = 90 - incidence
  const tDeg = (Math.asin(Math.sin(rad(incidence)) / FILM_N) * 180) / Math.PI
  const run = FILM * Math.tan(rad(tDeg))
  // Centre the dip in the pane, so both sides have the same room.
  const A = { x: (X0 + X1) / 2 - run, y: TOP }
  const B = { x: A.x + run, y: TOP + FILM }
  const C = { x: A.x + 2 * run, y: TOP }
  // One length for every ray, as far as the pane allows at this angle, so light
  // in and light out stay mirror images.
  const reach = Math.min(
    (TOP - 44) / Math.cos(rad(incidence)),
    (A.x - X0) / Math.sin(rad(incidence)),
  )
  const light = polar(A.x, A.y, reach, inDeg)
  const out1 = polar(A.x, A.y, reach, outDeg)
  const out2 = polar(C.x, C.y, reach, outDeg)

  // — Right: each colour's two returning waves, and what survives. —
  const WX = 356
  const WW = 150
  const ROW0 = 52
  const ROW = 52
  const AMP = 9
  const BAR_X = WX + WW + 22
  const BAR_W = 44

  return (
    <Figure
      n={n}
      caption={
        <>
          Move across it to tilt the card. Path 1 bounces off the coating, path 2 dips
          through to the steel and back. Each colour survives where the two waves land in
          step, and cancels where they don&apos;t.
        </>
      }
    >
      <TiltPad
        label="Card tilt"
        value={tilt}
        max={FILM_TILT}
        valueText={`Light arrives at ${Math.round(incidence)} degrees`}
        bind={bind}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
          {/* Steel and the coating on it. */}
          <rect x={X0} y={TOP + FILM} width={X1 - X0} height={STEEL} rx={4} fill={lite(16)} />
          <rect x={X0} y={TOP} width={X1 - X0} height={FILM} fill={lite(4)} />
          <line x1={X0} y1={TOP} x2={X1} y2={TOP} strokeWidth={1} style={{ stroke: lite(30) }} />
          <Label x={X1 - 10} y={TOP + FILM / 2} anchor="end">
            coating
          </Label>
          <Label x={X1 - 10} y={TOP + FILM + STEEL / 2} anchor="end">
            steel
          </Label>

          {/* The normal: light in and path 1 out sit at the same angle to it. */}
          <Ray from={A} deg={90} length={reach * Math.cos(rad(incidence))} opacity={20} dashed />
          <line
            x1={light.x}
            y1={light.y}
            x2={A.x}
            y2={A.y}
            strokeWidth={1.5}
            strokeLinecap="round"
            style={{ stroke: lite(85) }}
          />
          <Label x={light.x} y={light.y - 14}>
            light
          </Label>
          <line
            x1={A.x}
            y1={A.y}
            x2={out1.x}
            y2={out1.y}
            strokeWidth={1.25}
            strokeLinecap="round"
            style={{ stroke: lite(60) }}
          />
          {/* The extra distance path 2 travels. */}
          <polyline
            points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
            fill="none"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ stroke: lite(85) }}
          />
          <line
            x1={C.x}
            y1={C.y}
            x2={out2.x}
            y2={out2.y}
            strokeWidth={1.25}
            strokeDasharray="3 3"
            strokeLinecap="round"
            style={{ stroke: lite(60) }}
          />
          <Label x={out1.x - 10} y={out1.y - 10}>
            1
          </Label>
          <Label x={out2.x + 10} y={out2.y - 10}>
            2
          </Label>

          {BANDS.map((band, i) => {
            const y = ROW0 + i * ROW
            const px = band.nm / 10 // on-screen cycle length, true to scale between rows
            const phase = (2 * Math.PI * extra) / band.nm
            const kept = survives(extra, band.nm)
            return (
              <g key={band.nm}>
                <Label x={WX - 14} y={y} anchor="end">
                  {band.name}
                </Label>
                <polyline
                  points={wave(WX, y, WW, px, AMP, 0)}
                  fill="none"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  style={{ stroke: band.colour }}
                />
                <polyline
                  points={wave(WX, y, WW, px, AMP, phase)}
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  style={{ stroke: band.colour, opacity: 0.6 }}
                />
                {/* How much of this colour survives. */}
                <rect x={BAR_X} y={y - 3} width={BAR_W} height={6} rx={3} fill={lite(10)} />
                <rect
                  x={BAR_X}
                  y={y - 3}
                  width={Math.max(6, BAR_W * kept)}
                  height={6}
                  rx={3}
                  style={{ fill: band.colour, opacity: 0.35 + 0.65 * kept }}
                />
              </g>
            )
          })}

          {/* What you see: everything that survived, mixed. */}
          <circle cx={WX + 6} cy={ROW0 + 3 * ROW + 6} r={9} style={{ fill: filmColour(extra) }} />
          <Label x={WX + 24} y={ROW0 + 3 * ROW + 6} anchor="start">
            what you see
          </Label>
        </svg>
      </TiltPad>
    </Figure>
  )
}
