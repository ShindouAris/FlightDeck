import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GooeyToaster } from 'goey-toast'
import "goey-toast/styles.css"
import './i18n.ts'
import { Analytics } from "@vercel/analytics/next"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Analytics />
    <GooeyToaster position="top-center" />
    <App />
  </StrictMode>,
)
