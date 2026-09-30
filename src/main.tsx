import { StrictMode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * INVARIANT: [The Splash Is Torn Down Only By A Committed Frame]
 *
 * ISSUE-001 shipped a ~500ms void between first paint and hydration: the
 * stylesheet is imported from this module, so Vite has not fetched it yet and the
 * document has nothing to paint. `index.html` therefore carries a static boot
 * splash that costs no network request, and this file owns removing it.
 *
 * The removal MUST happen after React has committed, not merely after `render()`
 * was called. `createRoot().render()` schedules work; deleting the splash on the
 * same tick would blank the document for exactly as long as the void it was
 * built to fill. `flushSync` forces the initial mount to commit synchronously, so
 * by the time the line below runs the cockpit is on screen and the splash can go
 * without a flash.
 */
flushSync(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

// Defence in depth: the inline watchdog in `index.html` observes this node
// disappearing and disarms its own failure timer. `remove()` rather than
// `display: none` because the watchdog keys off `getElementById`, and a hidden
// splash left in the tree is one more thing to leak into a later DOM query.
document.getElementById('boot')?.remove()