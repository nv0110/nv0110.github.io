import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import './App.css'
import App from './App.jsx'

// Apply dark mode to body
document.body.classList.add('dark');

createRoot(document.getElementById('root')).render(
  //<StrictMode>
    <HashRouter>
    <App />
    </HashRouter>
 // </StrictMode>,
)
