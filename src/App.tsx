import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, animate, useMotionValue, useReducedMotion } from 'motion/react'
import type { PanInfo } from 'motion/react'
import './App.css'
import profilePic from './assets/images/profile-pic.png'
import Intro from './components/Intro'
import Education from './components/Education'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Artifacts from './components/Artifacts'
import SocialsBar from './components/SocialsBar'
import SandboxTeaser from './components/SandboxTeaser'
import MoodboardCanvas from './components/MoodboardCanvas'
import Sandbox, { SandboxStudy } from './pages/Sandbox'
import { studies } from './sandbox/studies'
import RevolutCard from './pages/RevolutCard'
import RevolutEnv from './pages/RevolutEnv'
import { EASE_UI } from './revolut-card/motionTokens'
import { slingshot } from './lib/sounds'

const PULL_THRESHOLD = 72
// Spring the avatar snaps back on when a drag is released. The idle hint
// returns on it too, so the hint looks exactly like letting go.
const SNAP_BACK = { stiffness: 480, damping: 22 }

// Idle hint: every so often the avatar slides out of its dotted ring, holds,
// and snaps back — until the visitor has dragged it themselves.
const HINT_FIRST_DELAY = 2500
const HINT_INTERVAL = 8000
const HINT_PULL = 16
const HINT_PULL_MS = 450
const HINT_HOLD_MS = 200
const HINT_ANGLE_STEP = Math.PI * (3 - Math.sqrt(5)) // golden angle, ≈137.5°

// Dotted ring 4px outside the 56px avatar, dotted like the article's back link.
const RING_RADIUS = 32
const RING_BOX = RING_RADIUS * 2 + 2
// ~4px between dots, stretched so a whole number fits the circumference —
// otherwise two dots bunch up where the path closes.
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const RING_DOT_GAP = RING_CIRCUMFERENCE / Math.round(RING_CIRCUMFERENCE / 4)

function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  return path
}

function ProfileCard({ onSlingshot, isPersonal }: { onSlingshot: () => void; isPersonal: boolean }) {
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const reduceMotion = useReducedMotion()
  // Refs, not state: the hint loop reads them and nothing re-renders on them.
  const hasDragged = useRef(false)
  const isHovered = useRef(false)

  useEffect(() => {
    if (reduceMotion) return
    let timer = 0
    let cancelled = false
    // Stay still while the pointer is on it (a hand is already there) or the
    // tab is hidden; stop for good once they've found the drag.
    const idle = () => !cancelled && !hasDragged.current && !isHovered.current && !document.hidden

    const next = () => {
      if (!cancelled && !hasDragged.current) timer = window.setTimeout(tug, HINT_INTERVAL)
    }

    // Timed rather than awaited: a tap can interrupt the pull, and the return
    // must still run or the avatar would sit off-centre.
    const release = () => {
      // A real drag may have grabbed the values mid-pull; leave them to it.
      if (!hasDragged.current) {
        const snap = { type: 'spring', ...SNAP_BACK } as const
        animate(x, 0, snap)
        animate(y, 0, snap)
      }
      next()
    }

    // Golden-angle steps from a random start: every tug heads somewhere clearly
    // different from the last, and the sequence never settles into a pattern.
    let angle = Math.random() * Math.PI * 2

    const tug = () => {
      if (!idle()) return next()
      angle += HINT_ANGLE_STEP
      const dx = Math.cos(angle)
      // Tugs towards the name travel half as far, so the avatar never lands on it.
      const distance = HINT_PULL * (dx > 0 ? 1 - dx / 2 : 1)
      const pull = { duration: HINT_PULL_MS / 1000, ease: EASE_UI }
      animate(x, dx * distance, pull)
      animate(y, Math.sin(angle) * distance, pull)
      timer = window.setTimeout(release, HINT_PULL_MS + HINT_HOLD_MS)
    }

    timer = window.setTimeout(tug, HINT_FIRST_DELAY)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [reduceMotion, x, y])

  function handleDragStart() {
    hasDragged.current = true
    setIsDragging(true)
  }

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    setIsDragging(false)
    if (Math.hypot(info.offset.x, info.offset.y) > PULL_THRESHOLD) {
      slingshot()
      onSlingshot()
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* The ring stays put while the avatar is pulled, so it reads as the
          socket the slingshot springs back into. */}
      <div className="relative shrink-0">
        <svg
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          width={RING_BOX}
          height={RING_BOX}
          viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
        >
          <circle
            cx={RING_BOX / 2}
            cy={RING_BOX / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray={`0 ${RING_DOT_GAP}`}
            style={{ stroke: 'color-mix(in oklch, var(--color-primary) 28%, transparent)' }}
          />
        </svg>
        <motion.img
          src={profilePic}
          alt="Julius Peschard"
          draggable={false}
          className={`block w-14 h-14 rounded-full object-cover ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ x, y }}
          onHoverStart={() => (isHovered.current = true)}
          onHoverEnd={() => (isHovered.current = false)}
          drag
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          dragTransition={{ bounceStiffness: SNAP_BACK.stiffness, bounceDamping: SNAP_BACK.damping }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold text-primary tracking-[-0.01em] whitespace-nowrap">
          Julius Peschard
        </span>
        <motion.span
          key={isPersonal ? 'personal' : 'pro'}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 0.4, y: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="text-sm font-medium text-primary tracking-[-0.01em] whitespace-nowrap"
        >
          {isPersonal ? 'Just a person' : 'Design Engineer'}
        </motion.span>
      </div>
    </div>
  )
}

function MainPortfolio() {
  const [isPersonal, setIsPersonal] = useState(false)
  const px = useMemo(() => Math.max(16, (window.innerWidth - 520) / 2), [])
  const py = 64

  // Align both modes' header to the same spot before swapping so the
  // slingshot release reads as the content moving beneath a static header.
  const toggle = () => {
    window.scrollTo(0, 0)
    setIsPersonal(p => !p)
  }

  return (
    <div
      className={`relative w-full bg-surface dark:bg-base ${
        isPersonal ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Persistent profile header — the anchor. Absolute in both modes so it
          never reserves flow space (toggling can't snap the exiting content) and
          never blocks canvas panning. In portfolio mode it still scrolls away
          because it's absolute within the min-h-screen container that scrolls
          with the body; the content below just clears it with top padding. */}
      <div className="absolute z-20" style={{ left: px, top: py }}>
        <ProfileCard isPersonal={isPersonal} onSlingshot={toggle} />
      </div>

      {/* No mode="wait" — the two views cross over simultaneously so the canvas
          changes in step with the header title instead of after it. */}
      <AnimatePresence>
        {isPersonal ? (
          <motion.div
            key="canvas"
            className="absolute inset-0 bg-[#f5f0e6] dark:bg-[#1c1815]"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <MoodboardCanvas />
          </motion.div>
        ) : (
          <motion.main
            key="content"
            className="pb-32"
            style={{ paddingTop: py + 80 }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <Intro />
            <Experience />
            <Projects />
            <Artifacts />
            <SandboxTeaser />
            <Education />
          </motion.main>
        )}
      </AnimatePresence>

      {/* SocialsBar is fixed — kept outside the transform-animated content so its
          viewport anchoring isn't broken by a translate containing block. */}
      {!isPersonal && <SocialsBar />}
    </div>
  )
}

export default function App() {
  const path = usePath()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  if (path === '/sandbox') return <Sandbox />
  const study = studies.find((s) => path === `/sandbox/${s.id}`)
  if (study) return <SandboxStudy study={study} />
  if (path === '/artifacts/chrome-is-a-room') return <RevolutCard />
  if (path === '/env') return <RevolutEnv />
  return <MainPortfolio />
}
