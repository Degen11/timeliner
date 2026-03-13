import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NuqsAdapter } from 'nuqs/adapters/react-router'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NuqsAdapter>
        <App />
      </NuqsAdapter>
    </BrowserRouter>
  </StrictMode>,
)
