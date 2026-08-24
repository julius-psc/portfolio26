import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'motion/react'

const FADE_IN_DURATION  = 1200
const FADE_OUT_DURATION = 600
const TICK              = 50
const DISK_PEEK         = 18  // px

interface AlbumCardProps {
  cover: string
  query: string
  isOpen: boolean
  onToggle: () => void
}

export default function AlbumCard({ cover, query, isOpen, onToggle }: AlbumCardProps) {
  const rotation = useMotionValue(0)
  const diskX    = useMotionValue(0)

  const [isHovered, setIsHovered] = useState(false)

  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const fadeRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewUrlRef   = useRef<string | null>(null)
  const fetchPromiseRef = useRef<Promise<string | null> | null>(null)

  function clearFade() {
    if (fadeRef.current) { clearInterval(fadeRef.current); fadeRef.current = null }
  }

  function fadeIn(audio: HTMLAudioElement) {
    clearFade()
    audio.volume = 0
    audio.play().catch(() => {})
    const step = TICK / FADE_IN_DURATION
    fadeRef.current = setInterval(() => {
      audio.volume = Math.min(1, audio.volume + step)
      if (audio.volume >= 1) clearFade()
    }, TICK)
  }

  function fadeOut(audio: HTMLAudioElement) {
    clearFade()
    const step = TICK / FADE_OUT_DURATION
    fadeRef.current = setInterval(() => {
      audio.volume = Math.max(0, audio.volume - step)
      if (audio.volume <= 0) { clearFade(); audio.pause() }
    }, TICK)
  }

  function getPreviewUrl(): Promise<string | null> {
    if (previewUrlRef.current) return Promise.resolve(previewUrlRef.current)
    if (!fetchPromiseRef.current) {
      fetchPromiseRef.current = fetch(`/api/deezer-preview?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => {
          const url: string | null = d.data?.[0]?.preview ?? null
          previewUrlRef.current = url
          return url
        })
        .catch(() => null)
    }
    return fetchPromiseRef.current
  }

  // Spin while music is playing
  useEffect(() => {
    if (!isOpen) return
    const controls = animate(rotation, rotation.get() + 360, {
      duration: 2, ease: 'linear', repeat: Infinity,
    })
    return () => controls.stop()
  }, [isOpen])

  // Peek disk on hover
  useEffect(() => {
    animate(diskX, isHovered ? DISK_PEEK : 0, { type: 'spring', stiffness: 320, damping: 30 })
  }, [isHovered])

  // Play / pause with fade
  useEffect(() => {
    if (isOpen) {
      getPreviewUrl().then(url => {
        if (!url) return
        if (!audioRef.current) { audioRef.current = new Audio(url); audioRef.current.loop = true }
        fadeIn(audioRef.current)
      })
    } else if (audioRef.current) {
      fadeOut(audioRef.current)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      clearFade()
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  return (
    <div
      className="relative w-32 h-32"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Vinyl disk */}
      <motion.div
        className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-zinc-800"
        style={{
          rotate: rotation,
          x: diskX,
          boxShadow: [
            'inset 0 0 0 8px rgba(255,255,255,0.035)',
            'inset 0 0 0 18px rgba(255,255,255,0.035)',
            'inset 0 0 0 28px rgba(255,255,255,0.035)',
            'inset 0 0 0 38px rgba(255,255,255,0.035)',
          ].join(', '),
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-zinc-800 dark:bg-zinc-700" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
        </div>
      </motion.div>

      {/* Album cover */}
      <img
        src={cover}
        alt="Album"
        draggable={false}
        onClick={onToggle}
        className="relative z-10 w-32 h-32 rounded-xl object-cover cursor-pointer"
      />
    </div>
  )
}
