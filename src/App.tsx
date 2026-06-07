import './App.css'
import Intro from './components/Intro'
import Experience from './components/Experience'
import Projects from './components/Projects'
import HalftoneFlickerBanner from './components/HalftoneFlickerBanner'
import SocialsBar from './components/SocialsBar'

function App() {
  return (
    <main className="min-h-screen bg-surface pb-32">
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
      <SocialsBar />
    </main>
  )
}

export default App
