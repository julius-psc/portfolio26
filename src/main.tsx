import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const mq = window.matchMedia('(prefers-color-scheme: dark)')
const applyDark = (dark: boolean) => document.documentElement.classList.toggle('dark', dark)
applyDark(mq.matches)
mq.addEventListener('change', (e) => applyDark(e.matches))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
