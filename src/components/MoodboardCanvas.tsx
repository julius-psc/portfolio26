import { useRef, useState, useMemo, useId } from 'react'
import { motion, useMotionValue, animate } from 'motion/react'
import AlbumCard    from './AlbumCard'
import indecisiv   from '../assets/images/indecisiv.png'
import twoMan      from '../assets/images/2man.png'
import sellout     from '../assets/images/sellout.png'
import daniel           from '../assets/images/personal/photos/daniel.png'
import dock             from '../assets/images/personal/photos/dock.png'
import dreamBig         from '../assets/images/personal/photos/dream-big.png'
import dxb              from '../assets/images/personal/photos/dxb.png'
import dxb2             from '../assets/images/personal/photos/dxb2.png'
import france           from '../assets/images/personal/photos/france.png'
import hike             from '../assets/images/personal/photos/hike.png'
import india            from '../assets/images/personal/photos/india.png'
import ldn              from '../assets/images/personal/photos/ldn.png'
import me1              from '../assets/images/personal/photos/me1.png'
import paris            from '../assets/images/personal/photos/paris.png'
import pepper           from '../assets/images/personal/photos/pepper.png'
import quote1           from '../assets/images/personal/photos/quote1.png'
import rugby            from '../assets/images/personal/photos/rugby.png'
import small            from '../assets/images/personal/photos/small.png'
import whatif           from '../assets/images/personal/photos/whatif.png'
import raycastIcon      from '../assets/images/personal/tools/raycast.svg'
import figmaIcon        from '../assets/images/personal/tools/figma.svg'
import cursorIcon       from '../assets/images/personal/tools/cursor.svg'
import deepwork         from '../assets/images/personal/books/deepwork.jpg'
import designOfEveryday from '../assets/images/personal/books/designofeveryday.jpg'
import limitless        from '../assets/images/personal/books/limitless.jpg'

const PAN_LIMIT = { x: 220, yUp: 160, yDown: 180 }

// Bounding box of the scattered content (canvas coords). Used to center the
// board on any viewport and to scale it up so it fills a wide screen instead of
// leaving big margins.
const CONTENT_CENTER = { x: 526, y: 425 }
const CONTENT_WIDTH  = 1548 // spans roughly x: -248 → 1300

function BookCard({ cover, spineColor }: { cover: string; spineColor: string }) {
  const uid     = useId().replace(/:/g, '')
  const clipId  = `cover-${uid}`
  const hingeId = `hinge-${uid}`

  return (
    <svg width="100%" viewBox="0 0 154 208" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={clipId}>
          <rect x="22" y="2" width="122" height="196" />
        </clipPath>
        <linearGradient id={hingeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C0BDB4" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#C0BDB4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Drop shadow */}
      <rect x="21" y="12" width="128" height="193" rx="3" fill="black" fillOpacity="0.07" />

      {/* Page block edges */}
      <rect x="14" y="4" width="131" height="196" rx="2" fill="#EDEAE3" />
      <rect x="13" y="3" width="131" height="196" rx="2" fill="#F2EFE9" />
      <rect x="12" y="2" width="131" height="196" rx="2" fill="#F7F4EE" />

      {/* Spine */}
      <rect x="12" y="2" width="10" height="196" rx="2" fill={spineColor} />

      {/* Hinge */}
      <rect x="21" y="2" width="1.5" height="196" fill="#C8C5BC" />
      <rect x="22.5" y="2" width="5" height="196" fill={`url(#${hingeId})`} />

      {/* Cover photo fills the front face */}
      <image
        href={cover}
        x="22" y="2" width="122" height="196"
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Border sits on top of the cover photo */}
      <rect x="22.75" y="2.75" width="120.5" height="194.5" stroke="#E2DFDA" strokeWidth="1.5" fill="none" />

      {/* Spine left highlight */}
      <rect x="12" y="2" width="4" height="196" fill="white" fillOpacity="0.3" rx="2" />
    </svg>
  )
}

function CanvasLabel({
  text, width, color, fontSize = 20,
}: { text: string; width: number; color: string; fontSize?: number }) {
  return (
    <p
      style={{
        fontFamily: 'Caveat, cursive',
        fontSize,
        lineHeight: 1.3,
        color,
        width,
      }}
    >
      {text}
    </p>
  )
}

// Whole days from today until the next occurrence of month/day (1-indexed month).
function daysUntil(month: number, day: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let target = new Date(today.getFullYear(), month - 1, day)
  if (target < today) target = new Date(today.getFullYear() + 1, month - 1, day)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export default function MoodboardCanvas() {
  const [activeId,   setActiveId]   = useState<string | null>(null)
  const [grabbing,   setGrabbing]   = useState(false)

  const offsetX    = useMotionValue(0)
  const offsetY    = useMotionValue(0)
  const panningRef = useRef(false)
  const lastPt     = useRef({ x: 0, y: 0 })
  const lastTime   = useRef(0)
  const vel        = useRef({ x: 0, y: 0 })

  // Zoom the board up to fill wide viewports (never below 1:1, capped so it
  // doesn't get huge). Only kicks in when the screen is wider than the content.
  const scale = useMemo(
    () => Math.min(1.45, Math.max(1, (window.innerWidth * 0.94) / CONTENT_WIDTH)),
    [],
  )

  // Offset that centers the (scaled) content's bounding box in the viewport.
  const base = useMemo(() => ({
    x: window.innerWidth  / 2 - CONTENT_CENTER.x * scale,
    y: window.innerHeight / 2 - CONTENT_CENTER.y * scale,
  }), [scale])

  const daysLeft = daysUntil(6, 3) // days until 3rd June

  const { photos, albums, tools, books, labels } = useMemo(() => {
    // Static layout — captured via "Copy positions". Each image is pinned to its
    // own spot (no shuffle) and rotations are fixed, so the board is deterministic.
    const photos = [
      { src: france,   w: 200, x:  208, y: -199, rotate: -5 },
      { src: dock,     w: 148, x:   26, y:  -69, rotate:  4 },
      { src: ldn,      w: 186, x: -114, y:  811, rotate: -3 },
      { src: daniel,   w: 142, x:  177, y:  183, rotate:  6 },
      { src: me1,      w: 148, x:  699, y:  237, rotate: -4 },
      { src: india,    w: 162, x:  253, y:  326, rotate:  3 },
      { src: hike,     w: 168, x:  147, y:  653, rotate: -6 },
      { src: whatif,   w: 155, x: 1072, y:  641, rotate:  5 },
      { src: dxb,      w: 158, x: 1064, y:  -44, rotate: -2 },
      { src: pepper,   w: 158, x: 1142, y:  390, rotate:  4 },
      { src: paris,    w: 154, x:  475, y:  302, rotate: -5 },
      { src: quote1,   w: 138, x: -174, y:  170, rotate:  3 },
      { src: dxb2,     w: 168, x: -248, y:  454, rotate: -4 },
      { src: rugby,    w: 132, x:  872, y:  657, rotate:  6 },
      { src: dreamBig, w: 138, x:  559, y:  694, rotate: -3 },
      { src: small,    w: 120, x:  637, y:    3, rotate:  5 },
    ]

    const albums = [
      { id: 'indecisiv', cover: indecisiv, query: 'indecisive kidwild',   x:  -8, y: 405, rotate: -4 },
      { id: '2man',      cover: twoMan,    query: '2 man step crwnmason', x: 913, y: 481, rotate:  5 },
      { id: 'sellout',   cover: sellout,   query: 'sellout baby panna',   x: 377, y: 726, rotate: -3 },
    ]

    const tools = [
      { src: figmaIcon,   x: 810, y: 511, rotate:  4, size: 52, invertDark: false },
      { src: cursorIcon,  x: 186, y: 465, rotate: -5, size: 52, invertDark: true  }, // solid-black icon → flip to white in dark mode
      { src: raycastIcon, x: 479, y: 660, rotate:  3, size: 52, invertDark: false },
    ]

    const books = [
      { src: designOfEveryday, spineColor: '#F5C200', x: 822, y:  69, rotate: -4, w: 108 },
      { src: deepwork,         spineColor: '#C8A030', x: 717, y: 591, rotate:  5, w: 104 },
      { src: limitless,        spineColor: '#1E3A5C', x: 596, y: 441, rotate: -3, w: 104 },
    ]

    const labels = [
      { text: 'I love playing rugby and going to the gym',      x: 577, y: 813, rotate: -3, width: 210, color: '#6f9257', fontSize: 20 },
      { text: "I've lived across many countries",                x: 285, y: 574, rotate:  2, width: 190, color: '#5f7ba6', fontSize: 20 },
      { text: 'I have an obsession for fragrances',              x:  60, y: 552, rotate: -2, width: 200, color: '#8a6d9c', fontSize: 22 },
      { text: 'My favourite Premier League team is Tottenham, and my all-time favourite player: Dele Alli', x: 864, y: 274, rotate: 3, width: 236, color: '#4f6d99', fontSize: 22 },
      { text: 'The quote I live by: embrace discomfort',         x: -106, y: 729, rotate: -3, width: 214, color: '#b0705a', fontSize: 22 },
      { text: `I will make my first million before I turn 20 — ${daysLeft} days left to do so...`, x: 428, y: 158, rotate: 2, width: 250, color: '#a8894a', fontSize: 22 },
    ]

    return { photos, albums, tools, books, labels }
  }, [daysLeft])

  function clampPan(x: number, y: number) {
    return {
      x: Math.max(-PAN_LIMIT.x, Math.min(PAN_LIMIT.x, x)),
      y: Math.max(-PAN_LIMIT.yUp, Math.min(PAN_LIMIT.yDown, y)),
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-canvas-item]')) return
    panningRef.current = true
    setGrabbing(true)
    lastPt.current   = { x: e.clientX, y: e.clientY }
    lastTime.current = e.timeStamp
    vel.current      = { x: 0, y: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!panningRef.current) return
    const dx = e.clientX - lastPt.current.x
    const dy = e.clientY - lastPt.current.y
    const dt = e.timeStamp - lastTime.current
    if (dt > 0) vel.current = { x: (dx / dt) * 1000, y: (dy / dt) * 1000 }
    lastPt.current   = { x: e.clientX, y: e.clientY }
    lastTime.current = e.timeStamp
    const clamped = clampPan(offsetX.get() + dx, offsetY.get() + dy)
    offsetX.set(clamped.x)
    offsetY.set(clamped.y)
  }

  function onPointerUp() {
    if (!panningRef.current) return
    panningRef.current = false
    setGrabbing(false)
    const target = clampPan(
      offsetX.get() + vel.current.x * 0.12,
      offsetY.get() + vel.current.y * 0.12,
    )
    animate(offsetX, target.x, { type: 'spring', stiffness: 120, damping: 26 })
    animate(offsetY, target.y, { type: 'spring', stiffness: 120, damping: 26 })
  }

  return (
    <div
      className={`w-full h-full overflow-hidden bg-[#f5f0e6] dark:bg-[#1c1815] ${grabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <motion.div
        className="absolute"
        style={{ left: base.x, top: base.y, x: offsetX, y: offsetY, scale, transformOrigin: '0 0' }}
      >
        {/* Photos */}
        {photos.map((photo, i) => (
          <motion.div
            key={i}
            data-canvas-item=""
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ left: photo.x, top: photo.y, rotate: photo.rotate, width: photo.w }}
            drag
            dragMomentum={false}
          >
            <img src={photo.src} draggable={false} className="w-full h-auto rounded-sm" />
          </motion.div>
        ))}

        {/* Albums */}
        {albums.map((album) => (
          <motion.div
            key={album.id}
            data-canvas-item=""
            className="absolute"
            style={{ left: album.x, top: album.y, rotate: album.rotate }}
            drag
            dragMomentum={false}
          >
            <AlbumCard
              cover={album.cover}
              query={album.query}
              isOpen={activeId === album.id}
              onToggle={() => setActiveId(p => p === album.id ? null : album.id)}
            />
          </motion.div>
        ))}

        {/* Books */}
        {books.map((book, i) => (
          <motion.div
            key={i}
            data-canvas-item=""
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ left: book.x, top: book.y, rotate: book.rotate, width: book.w }}
            drag
            dragMomentum={false}
          >
            <BookCard cover={book.src} spineColor={book.spineColor} />
          </motion.div>
        ))}

        {/* Tool icons */}
        {tools.map((tool, i) => (
          <motion.div
            key={i}
            data-canvas-item=""
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ left: tool.x, top: tool.y, rotate: tool.rotate, width: tool.size, height: tool.size }}
            drag
            dragMomentum={false}
          >
            <img
              src={tool.src}
              draggable={false}
              className={`w-full h-full object-contain rounded-xl ${tool.invertDark ? 'dark:invert' : ''}`}
            />
          </motion.div>
        ))}

        {/* Handwritten labels */}
        {labels.map((label, i) => (
          <motion.div
            key={i}
            data-canvas-item=""
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ left: label.x, top: label.y, rotate: label.rotate }}
            drag
            dragMomentum={false}
          >
            <CanvasLabel text={label.text} width={label.width} color={label.color} fontSize={label.fontSize} />
          </motion.div>
        ))}

      </motion.div>
    </div>
  )
}
