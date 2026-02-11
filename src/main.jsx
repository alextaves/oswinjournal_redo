import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CreditTitlePreview from './CreditTitlePreview.jsx'

const showCreditsPreview = new URLSearchParams(window.location.search).has('credits')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {showCreditsPreview ? <CreditTitlePreview /> : <App />}
  </StrictMode>,
)
