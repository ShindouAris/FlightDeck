import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GooeyToaster } from 'goey-toast'
import "goey-toast/styles.css"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GooeyToaster position="top-center" />
    <App />
  </StrictMode>,
)
