import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import './App.css'
import Intro from './components/Intro'
import Education from './components/Education'
import Experience from './components/Experience'
import Projects from './components/Projects'
import HalftoneFlickerBanner from './components/HalftoneFlickerBanner'
import SocialsBar from './components/SocialsBar'
import SandboxTeaser from './components/SandboxTeaser'
import Sandbox from './pages/Sandbox'
import Aurora from './pages/Aurora'

function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  return path
}

function MainPortfolio() {
  return (
    <main className="min-h-screen bg-surface dark:bg-base pb-32">
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
      <SocialsBar />
    </main>
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
