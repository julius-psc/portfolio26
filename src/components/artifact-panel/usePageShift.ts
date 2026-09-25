import { useCallback, useState } from 'react'
import { PANEL_SPRING_CSS } from '../../revolut-card/motionTokens'
import type { Dock } from './useArtifactPanel'

export type OnDockChange = (dock: Dock | null, reserve: number, animated: boolean) => void

/**
 * Lets a page glide aside for a side-docked artifact panel instead of sitting
 * under it. Pass `onDockChange` to the panel, then pad the page by `left` /
 * `right` with `glide` as the transition timing.
 */
export function usePageShift() {
  const [layout, setLayout] = useState<{ dock: Dock | null; reserve: number; animated: boolean }>({
    dock: null,
    reserve: 0,
    animated: true,
  })

  // Stable identity + bail-out on no-op reports, or the panel's layout effect
  // re-fires every render and loops.
  const onDockChange = useCallback<OnDockChange>((dock, reserve, animated) => {
    setLayout((prev) =>
      prev.dock === dock && prev.reserve === reserve && prev.animated === animated
        ? prev
        : { dock, reserve, animated },
    )
  }, [])

  return {
    onDockChange,
    left: layout.dock === 'left' ? layout.reserve : 0,
    right: layout.dock === 'right' ? layout.reserve : 0,
    /** The panel's own spring as CSS timing, so page and panel settle as one. */
    glide: layout.animated ? PANEL_SPRING_CSS : '0s',
  }
}
