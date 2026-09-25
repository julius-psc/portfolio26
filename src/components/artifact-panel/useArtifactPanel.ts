import { useEffect, useState } from 'react'
import { panelClose } from '@/lib/sounds'

/** Side the artifact panel is docked to, or `full` for the centred view. */
export type Dock = 'left' | 'right' | 'full'

export type Rect = { left: number; top: number; width: number; height: number }

export const PANEL_MARGIN = 16
const SIDE_PANEL_WIDTH = 520
/** Horizontal resize limits for a side-docked panel. */
export const MIN_SIDE_WIDTH = 400
export const MAX_SIDE_WIDTH = 640

/** Chrome between a panel's edge and its body: header, then the body's margins
 * (mx-2 mb-2). Mirrors ArtifactPanel's markup. */
const PANEL_HEADER_H = 44
const BODY_INSET_X = 8 * 2
const BODY_INSET_Y = PANEL_HEADER_H + 8

/** Below this viewport width there's no panel at all — the content stays inline. */
const PANEL_MIN_VIEWPORT = 768

const DOCKS: readonly Dock[] = ['left', 'right', 'full']

/** Last panel choice: where it was docked, whether it was collapsed, and the
 * side panel's dragged width. */
function readStoredPanel(
  storageKey: string,
): { dock: Dock | null; lastDock: Dock; width: number | null } | null {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (!raw || !DOCKS.includes(raw.lastDock)) return null
    return {
      dock: DOCKS.includes(raw.dock) ? raw.dock : null,
      lastDock: raw.lastDock,
      width:
        typeof raw.width === 'number'
          ? Math.max(MIN_SIDE_WIDTH, Math.min(MAX_SIDE_WIDTH, raw.width))
          : null,
    }
  } catch {
    return null
  }
}

/**
 * Panel state, lifted out of `ArtifactPanel` so the content can size itself
 * against the panel (see `sideBody`). Restores the reader's last choice from
 * `storageKey`; on a first visit it starts at `defaultDock` (null: inline), and
 * the "Open panel" button docks right.
 */
export function useArtifactPanel(
  storageKey: string,
  { defaultDock = 'right' }: { defaultDock?: Dock | null } = {},
) {
  const [stored] = useState(() => (typeof window === 'undefined' ? null : readStoredPanel(storageKey)))
  const [chosenDock, setDock] = useState<Dock | null>(() => (stored ? stored.dock : defaultDock))
  const [lastDock, setLastDock] = useState<Dock>(stored?.lastDock ?? defaultDock ?? 'right')
  // Seed with the real viewport so the panel's first frame is already in place
  // (starting from 0×0 made it sweep across the screen on load).
  const [viewport, setViewport] = useState(() =>
    typeof window === 'undefined'
      ? { w: 0, h: 0 }
      : { w: window.innerWidth, h: window.innerHeight },
  )
  const [sideWidth, setSideWidth] = useState(stored?.width ?? SIDE_PANEL_WIDTH)
  const [resizing, setResizing] = useState(false)
  // True while the browser window itself is resizing (e.g. macOS window snapping):
  // the panel must follow the new viewport instantly, not spring across it.
  const [windowResizing, setWindowResizing] = useState(false)

  // No panel on mobile — it would cover the page. The content stays inline and
  // the reader's desktop choice is kept (not overwritten) for when there's room again.
  const canPanel = viewport.w >= PANEL_MIN_VIEWPORT
  const dock = canPanel ? chosenDock : null
  const open = dock !== null

  useEffect(() => {
    if (chosenDock) setLastDock(chosenDock)
  }, [chosenDock])

  useEffect(() => {
    // Mid-drag the width changes every pointer move — save once it's let go.
    if (resizing) return
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ dock: chosenDock, lastDock: chosenDock ?? lastDock, width: sideWidth }),
      )
    } catch {
      // Storage unavailable (private mode, blocked) — the choice just won't persist.
    }
  }, [storageKey, chosenDock, lastDock, sideWidth, resizing])

  // Track viewport so panel geometry can be pure numbers. Window resizes (snapping,
  // dragging the window edge) apply instantly until they settle for 150 ms.
  useEffect(() => {
    let settle = 0
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight })
      setWindowResizing(true)
      window.clearTimeout(settle)
      settle = window.setTimeout(() => setWindowResizing(false), 150)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(settle)
    }
  }, [])

  // Esc closes.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      panelClose()
      setDock(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const sideW = Math.max(0, Math.min(sideWidth, MAX_SIDE_WIDTH, viewport.w - 2 * PANEL_MARGIN))

  return {
    /** Where the panel is docked; null while the content is inline. */
    dock,
    /** The dock it reopens to. */
    lastDock,
    open,
    canPanel,
    setDock,
    viewport,
    /** Side-panel width after clamping to its limits and the viewport. */
    sideWidth: sideW,
    /** Body of a side-docked panel (inside its header and margins): its width now,
     * its width at the narrowest side panel, and its height. */
    sideBody: {
      width: sideW - BODY_INSET_X,
      minWidth: Math.max(0, Math.min(MIN_SIDE_WIDTH, sideW) - BODY_INSET_X),
      height: Math.max(0, viewport.h - 2 * PANEL_MARGIN - BODY_INSET_Y),
    },
    setSideWidth,
    resizing,
    setResizing,
    windowResizing,
  }
}

export type ArtifactPanelState = ReturnType<typeof useArtifactPanel>
