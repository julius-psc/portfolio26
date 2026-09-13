import { useEffect, useRef } from 'react'
import { startEnvPreview } from '../revolut-card/env/startEnvPreview'

export default function RevolutEnv() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return startEnvPreview(canvas)
  }, [])

  return (
    <main className="fixed inset-0 bg-black">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="Studio environment preview"
      />
      <p className="pointer-events-none absolute bottom-[19%] left-4 text-[11px] font-medium tracking-[-0.01em] text-white/40">
        Keys 0–5 / ← → roughness · strip = GGX mips 0–5
      </p>
    </main>
  )
}
