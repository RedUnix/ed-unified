import React from 'react'
import ReactDOM from 'react-dom/client'
import BootScreen from './components/BootScreen'
import './styles/theme-variables.css'
import './styles/boot.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BootScreen />
  </React.StrictMode>
)
