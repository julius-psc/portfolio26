import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { startRevolutCard } from '../revolut-card/start'

export default function RevolutCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lightsOn, setLightsOn] = useState(true)
  const lightsOnRef = useRef(lightsOn)
  lightsOnRef.current = lightsOn

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return startRevolutCard(canvas, {
      getLightsOn: () => lightsOnRef.current,
    })
  }, [])

  return (
    <main
      className="fixed inset-0"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 50% 48%, #0a0a0b 0%, #050505 70%, #030303 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="Revolut chrome card"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-8 pt-16">
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-full px-3 py-2"
          style={{
            background: 'rgba(18, 18, 18, 0.72)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 28px rgba(0,0,0,0.45)',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          <span
            className="pl-1 text-[12px] tracking-[0.04em] text-white/45"
            style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
          >
            Studio light
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={lightsOn}
            aria-label={lightsOn ? 'Turn studio light off' : 'Turn studio light on'}
            onClick={() => setLightsOn((v) => !v)}
            className="btn-press relative h-7 w-12 shrink-0 rounded-full"
            style={{
              background: lightsOn ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.14)',
              transitionProperty: 'background-color',
              transitionDuration: '0.35s',
              transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            <motion.span
              className="absolute top-0.5 left-0.5 block size-6 rounded-full"
              style={{
                background: lightsOn ? '#111' : 'rgba(255,255,255,0.88)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
              }}
              animate={{ x: lightsOn ? 20 : 0 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
              initial={false}
            />
          </button>
        </div>
      </div>
    </main>
  )
}
