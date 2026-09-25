import { useRef, useState } from 'react'
import { LiveCardArtifact } from './LiveCardArtifact'
import { ArtifactPanel, type Flight } from '../artifact-panel/ArtifactPanel'
import { useArtifactPanel, type Dock } from '../artifact-panel/useArtifactPanel'
import { STUDIO_PAD } from '../artifact-panel/studio'
import { CARD_H, CARD_W } from '../../revolut-card/cardMesh'
import { FILL_EMBED } from '../../revolut-card/start'

/** Studio padding each side — canvas = host − 2×this. */
const FRAME_PAD = STUDIO_PAD

/** Panels give the card the stage — tighter framing than the inline figure. */
const PANEL_FILL = 0.68
/** Upright card at the narrowest side panel: share of the canvas it fills. */
const SIDE_UPRIGHT_FILL = 0.58
/** Hysteresis (px) around the lay-flat point so a drag there doesn't flip-flop. */
const SIDE_TURN_SLACK = 8

type Orientation = 'portrait' | 'landscape'

/** Long-edge px the renderer's fill framing gives a flat card in a canvas of cw×ch. */
function fitPx(cw: number, ch: number, fill: number): number {
  return Math.min(fill * cw, fill * ch * (CARD_W / CARD_H))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * The Revolut card in an artifact panel. The panel owns docking, resizing and
 * the flight between inline and docked; this keeps the card's size steady
 * through all of it. There is only one WebGPU context, so the panel moving the
 * one live card (never remounting it) is what makes this work.
 */
export function CardArtifact({
  onDockChange,
}: {
  /** Reports the current dock, the px it reserves on that edge, and whether the
   * essay should animate the change (false while resizing, or with reduced motion). */
  onDockChange?: (dock: Dock | null, reserve: number, animated: boolean) => void
}) {
  const panel = useArtifactPanel('revolut-card:panel')
  const { dock, lastDock, open, sideBody } = panel

  // Side panels (and the centred view) lock the card to its upright size at the
  // narrowest side width, so resizing or switching between them never scales it.
  // Once the canvas is wide enough to hold that same card lying flat (with the
  // panel's usual breathing room), it turns.
  const [sideLandscape, setSideLandscape] = useState(false)
  const sideCanvasW = sideBody.width - 2 * FRAME_PAD
  const sideCanvasH = Math.max(0, sideBody.height - 2 * FRAME_PAD)
  const minCanvasW = Math.max(0, sideBody.minWidth - 2 * FRAME_PAD)
  const sideCardPx = Math.round(
    Math.min(
      SIDE_UPRIGHT_FILL * minCanvasW * (CARD_W / CARD_H), // upright: short edge across
      SIDE_UPRIGHT_FILL * sideCanvasH, // upright: long edge down
    ),
  )
  const flatFitsW = sideCardPx / PANEL_FILL
  // Adjusted during render (not in an effect) so the card starts turning on the
  // same frame the drag crosses the threshold.
  if (!sideLandscape && sideCanvasW >= flatFitsW + SIDE_TURN_SLACK) setSideLandscape(true)
  if (sideLandscape && sideCanvasW <= flatFitsW - SIDE_TURN_SLACK) setSideLandscape(false)

  // Where the card settles in a given home, and how big it is there — the flight
  // interpolates between these so the hand-off at either end is seamless.
  const restOrientation = (d: Dock | null): Orientation | undefined =>
    d === null ? undefined : d === 'full' || sideLandscape ? 'landscape' : 'portrait'
  const restPx = (d: Dock | null): number | undefined => (d === null ? undefined : sideCardPx)

  const [flying, setFlying] = useState(false)
  const flyingRef = useRef(false)
  const flightPxRef = useRef<number | undefined>(undefined)
  const [flightOrientation, setFlightOrientation] = useState<Orientation>('landscape')
  const restingPx = restPx(dock)
  const cardPx = () => (flyingRef.current ? flightPxRef.current : restingPx)

  // Rides the panel's flight, easing the card between its inline size and its
  // panel size in step with the panel.
  const onFlight = ({ toPanel, midFlight, slotRect }: Flight) => {
    const inlinePx = () => {
      const r = slotRect()
      return r ? fitPx(r.width - 2 * FRAME_PAD, r.height - 2 * FRAME_PAD, FILL_EMBED) : 0
    }
    const fromPx = midFlight ? flightPxRef.current : toPanel ? inlinePx() : restPx(lastDock)
    const toPx = () => (toPanel ? restPx(dock) : inlinePx()) ?? 0
    flyingRef.current = true
    flightPxRef.current = fromPx
    setFlying(true)
    setFlightOrientation(toPanel ? (restOrientation(dock) ?? 'landscape') : 'landscape')
    return (t: number) => {
      flightPxRef.current = fromPx === undefined ? undefined : lerp(fromPx, toPx(), t)
    }
  }

  const onLand = () => {
    flyingRef.current = false
    setFlying(false)
  }

  return (
    <ArtifactPanel
      panel={panel}
      inlineAspect="16 / 10"
      inlineNote="The card is open in the panel."
      onDockChange={onDockChange}
      onFlight={onFlight}
      onLand={onLand}
    >
      {/* The renderer re-fits its camera to any canvas aspect (and turns the card
          upright in tall frames), so the card simply fills whichever host it's in. */}
      <LiveCardArtifact
        fill={open ? PANEL_FILL : undefined}
        orientation={flying ? flightOrientation : restOrientation(dock)}
        cardPx={cardPx}
        framed={!open}
      />
    </ArtifactPanel>
  )
}
