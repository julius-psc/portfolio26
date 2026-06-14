import './App.css'
import { useState, useEffect } from 'react'
import Intro from './components/Intro'
import Education from './components/Education'
import Experience from './components/Experience'
import Projects from './components/Projects'
import HalftoneFlickerBanner from './components/HalftoneFlickerBanner'
import SocialsBar from './components/SocialsBar'
import Sandbox from './pages/Sandbox'
import SandboxTeaser from './components/SandboxTeaser'

function getPage() {
  return window.location.hash === '#sandbox' ? 'sandbox' : 'home'
}

function App() {
  const [page, setPage] = useState(getPage)

  useEffect(() => {
    const onHash = () => setPage(getPage())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (page === 'sandbox') return <Sandbox />

  return (
    <main className="min-h-screen bg-surface dark:bg-base pb-32">
      <Intro />
      <Education />
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
      <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
        <div className="w-full max-w-[520px]">
          <HalftoneFlickerBanner height={48} />
        </div>
      </div>
      <SandboxTeaser />
      <SocialsBar />
    </main>
  )
}

export default App
