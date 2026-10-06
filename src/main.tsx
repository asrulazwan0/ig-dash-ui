import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
function App() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    fetch('/api/health', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('API unavailable')
        const body: unknown = await response.json()
        if (typeof body !== 'object' || body === null || !('status' in body) || body.status !== 'ok') {
          throw new Error('Unexpected health response')
        }
        if (active) setStatus('ok')
      })
      .catch(() => { if (active) setStatus('error') })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [])
  return <main><p className="eyebrow">IT’S GIVING DASHBOARD</p><h1>Your logs. Your perspective.</h1>
    <p>A place to capture activity and understand what matters.</p>
    <section aria-labelledby="connection-heading"><h2 id="connection-heading">API connection</h2>
      <p role="status">{status === 'loading' ? 'Checking connection…' : status === 'ok' ? 'Connected. Your development environment is ready.' : 'Cannot reach the API. Start the backend and refresh this page.'}</p>
    </section>
    <p className="note">Account sign-in and private log storage are coming next.</p>
  </main>
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
