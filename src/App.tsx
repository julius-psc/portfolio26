import './App.css'
import Navbar from './components/Navbar'
import About from './components/About'
import Education from './components/Education'
import Experience from './components/Experience'
import Hero from './components/Hero'
import Projects from './components/Projects'
import Contact from './components/Contact'
import HalftoneFlickerBanner from './components/HalftoneFlickerBanner'

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <div className="px-6 pt-8">
        <HalftoneFlickerBanner height={100} className="max-w-2xl mx-auto" />
      </div>
      <Education />
      <div className="px-6">
        <HalftoneFlickerBanner height={100} className="max-w-2xl mx-auto" />
      </div>
      <Experience />
      <div className="px-6">
        <HalftoneFlickerBanner height={100} className="max-w-2xl mx-auto" />
      </div>
      <Projects />
      <div className="px-6">
        <HalftoneFlickerBanner height={100} className="max-w-2xl mx-auto" />
      </div>
      <Contact />
    </>
  )
}

export default App
