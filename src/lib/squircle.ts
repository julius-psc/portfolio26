import { getSvgPath } from 'figma-squircle'

interface SquircleOptions {
  width: number
  height: number
  cornerRadius: number
  cornerSmoothing?: number // 0–1, default 0.6
}

export function squirclePath({
  width,
  height,
  cornerRadius,
  cornerSmoothing = 0.6,
}: SquircleOptions): string {
  return getSvgPath({ width, height, cornerRadius, cornerSmoothing })
}

export function squircleClip(opts: SquircleOptions): React.CSSProperties {
  return { clipPath: `path('${squirclePath(opts)}')` }
}
