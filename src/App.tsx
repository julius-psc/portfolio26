import { useEffect, useMemo, useRef, useState } from 'react'
import Lenis from 'lenis'
import { motion, AnimatePresence } from 'motion/react'
import type { PanInfo } from 'motion/react'
import './App.css'
import profilePic from './assets/images/profile-pic.png'
import Intro from './components/Intro'
import Education from './components/Education'
import Experience from './components/Experience'
import Projects from './components/Projects'
import HalftoneFlickerBanner from './components/HalftoneFlickerBanner'
import SocialsBar from './components/SocialsBar'
import SandboxTeaser from './components/SandboxTeaser'
import MoodboardCanvas from './components/MoodboardCanvas'
import Sandbox from './pages/Sandbox'
import Aurora from './pages/Aurora'

const PULL_THRESHOLD = 72

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

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    setIsDragging(false)
    if (Math.hypot(info.offset.x, info.offset.y) > PULL_THRESHOLD) onSlingshot()
  }

  return (
    <div className="flex items-center gap-3">
      <motion.img
        src={profilePic}
        alt="Julius Peschard"
        draggable={false}
        className={`w-14 h-14 rounded-full object-cover shrink-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        drag
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 480, bounceDamping: 22 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      />
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
            <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
              <div className="w-full max-w-[520px]">
                <HalftoneFlickerBanner height={48} />
              </div>
            </div>
            <Experience />
            <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
              <div className="w-full max-w-[520px]">
                <HalftoneFlickerBanner height={48} />
              </div>
            </div>
            <Projects />
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
  const path    = usePath()
  const rafRef  = useRef<number>(0)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)

    if (path !== '/aurora') return

    const lenis = new Lenis({
      duration:        1.8,
      easing:          (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel:     true,
      wheelMultiplier: 0.6,
    })
    lenisRef.current = lenis

    const raf = (time: number) => {
      lenis.raf(time)
      rafRef.current = requestAnimationFrame(raf)
    }
    rafRef.current = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafRef.current)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [path])

  if (path === '/sandbox') return <Sandbox />
  if (path === '/aurora') return <Aurora />
  return <MainPortfolio />
}
