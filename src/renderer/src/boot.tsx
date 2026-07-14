import React from 'react'
import ReactDOM from 'react-dom/client'
import BootScreen from './components/BootScreen'
import './styles/theme-variables.css'
import './styles/boot.css'

// boot.html doubles as the tool-launch overlay: bootWindow.ts loads it with a
// `#launching=<tool name>` hash to get the small "Launching ..." variant.
const launchMatch = window.location.hash.match(/^#launching=(.*)$/)
const launchingToolName = launchMatch ? decodeURIComponent(launchMatch[1]) : null

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {launchingToolName !== null ? (
      <BootScreen variant="launch" toolName={launchingToolName} />
    ) : (
      <BootScreen />
    )}
  </React.StrictMode>
)
