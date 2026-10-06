import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, errorMessage, getSession } from './lib/api'
import { AccountForm } from './features/accounts/AccountForm'
import { Dashboard } from './features/logs/Dashboard'

export function App() {
  const client = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: ({ signal }) => getSession(signal), retry: false })
  useEffect(() => {
    const expire = () => { client.removeQueries({ queryKey: ['logs'] }); client.setQueryData(['session'], null) }
    window.addEventListener('session-expired', expire)
    return () => window.removeEventListener('session-expired', expire)
  }, [client])
  const logout = useMutation({ mutationFn: () => api<void>('/api/auth/logout', { method: 'POST', body: '{}' }),
    onSuccess: () => { client.clear(); client.setQueryData(['session'], null) },
  })
  return <><a className="skip-link" href="#main">Skip to content</a><header className="topbar"><a className="brand" href="/" aria-label="IGDash home"><span className="brand-mark" aria-hidden="true">✳</span> IGDash</a>
    {session.data ? <div className="user-nav"><span>{session.data.email}</span><button disabled={logout.isPending} onClick={() => logout.mutate()}>{logout.isPending ? 'Signing out…' : 'Sign out'}</button></div> : <span className="header-note">A clearer view of your day</span>}
  </header><main id="main">
    {session.isPending ? <p role="status">Loading your workspace…</p> : session.isError ? <section className="panel"><h1>Unable to connect.</h1><p role="alert">{errorMessage(session.error)}</p><button onClick={() => { void session.refetch() }}>Try again</button></section> : session.data ? <Dashboard key={session.data.id} user={session.data} /> : <div className="account-layout"><div className="intro"><p className="eyebrow">IT’S GIVING CLARITY</p><h1>Small moments.<br />A bigger picture.</h1><p>Keep a personal record of what happens, from quiet progress to the things worth a second look.</p><div className="intro-note"><span aria-hidden="true">↗</span> Your account. Your logs. Your perspective.</div></div><AccountForm onSignedIn={async () => { const user = await getSession(); client.clear(); client.setQueryData(['session'], user) }} /></div>}
    {logout.isError && <p role="alert" className="error">{errorMessage(logout.error)}</p>}
  </main><footer>Made for moments that matter.</footer></>
}
