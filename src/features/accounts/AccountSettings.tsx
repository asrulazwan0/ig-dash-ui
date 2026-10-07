import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, errorMessage, type Session } from '../../lib/api'

type Profile = { id: string; email: string; emailConfirmed: boolean; pendingEmail: string | null }
type BrowserSession = { id: string; device: string; createdAt: string; expiresAt: string; current: boolean }
export function AccountSettings({ user, onSignedOut }: { user: Session; onSignedOut: () => void }) {
  const client = useQueryClient()
  const profile = useQuery({ queryKey: ['account', user.id, 'profile'], queryFn: ({signal}) => api<Profile>('/api/auth/profile', {signal}), retry: false })
  const sessions = useQuery({ queryKey: ['account', user.id, 'sessions'], queryFn: ({signal}) => api<BrowserSession[]>('/api/auth/sessions', {signal}), retry: false })
  const password = useMutation({ mutationFn: (form: FormData) => api<void>('/api/auth/password/change', { method: 'POST', body: JSON.stringify({ currentPassword: form.get('currentPassword'), newPassword: form.get('newPassword') }) }), onSuccess: onSignedOut })
  const email = useMutation({ mutationFn: (form: FormData) => api<void>('/api/auth/email/change', { method: 'POST', body: JSON.stringify({ email: form.get('email'), currentPassword: form.get('currentPassword') }) }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['account', user.id, 'profile'] }) } })
  const revoke = useMutation({ mutationFn: (session: BrowserSession) => api<void>(`/api/auth/sessions/${session.id}/revoke`, { method: 'POST', body: '{}' }), onSuccess: async (_, session) => { if (session.current) onSignedOut(); else await client.invalidateQueries({ queryKey: ['account', user.id, 'sessions'] }) } })
  const all = useMutation({ mutationFn: () => api<void>('/api/auth/sessions/revoke-all', { method: 'POST', body: '{}' }), onSuccess: onSignedOut })
  return <><div className="welcome"><p className="eyebrow">YOUR ACCOUNT</p><h1>Account settings</h1><p className="muted">Protect your account and review where you are signed in.</p></div>
    <div className="settings-grid"><section className="panel"><h2>Change password</h2><p className="help">Changing your password signs out every session.</p>
      <form onSubmit={event => { event.preventDefault(); password.mutate(new FormData(event.currentTarget)) }}><label htmlFor="current-password">Current password</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" minLength={12} maxLength={128} required />
        <label htmlFor="new-password">New password</label><input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><p className="help">Uppercase, lowercase, a number, and a symbol; 12–128 characters.</p>
        {password.isError && <p role="alert" className="error">{errorMessage(password.error)}</p>}<button className="primary" disabled={password.isPending}>{password.isPending ? 'Changing…' : 'Change password'}</button></form>
    </section><section className="panel"><h2>Change email</h2>
      {profile.isPending ? <p>Loading your email…</p> : profile.isError ? <><p role="alert">{errorMessage(profile.error)}</p><button onClick={() => { void profile.refetch() }}>Retry profile</button></> : <><p>Current email: <strong>{profile.data.email}</strong> · {profile.data.emailConfirmed ? 'Verified' : 'Unverified'}</p>{profile.data.pendingEmail && <p className="notice">Waiting for confirmation: {profile.data.pendingEmail}</p>}</>}
      <p className="help">Your current email stays active until you confirm the new address. Confirmation signs out every session.</p>
      <form onSubmit={event => { event.preventDefault(); email.mutate(new FormData(event.currentTarget)) }}><label htmlFor="new-email">New email</label><input id="new-email" name="email" type="email" autoComplete="email" maxLength={254} required />
        <label htmlFor="email-password">Current password for email change</label><input id="email-password" name="currentPassword" type="password" autoComplete="current-password" minLength={12} maxLength={128} required />
        {email.isError && <p role="alert" className="error">{errorMessage(email.error)}</p>}{email.isSuccess && <p role="status" className="notice">Check your new inbox to confirm the change.</p>}<button className="primary" disabled={email.isPending}>{email.isPending ? 'Sending…' : 'Send email confirmation'}</button></form>
    </section></div><section className="panel sessions-panel"><h2>Active sessions</h2><p className="help">Sessions expire after eight hours. Sign out still revokes every session for your account.</p>
      {sessions.isPending ? <p>Loading sessions…</p> : sessions.isError ? <><p role="alert">{errorMessage(sessions.error)}</p><button onClick={() => { void sessions.refetch() }}>Retry sessions</button></> : <ul className="session-list">{sessions.data.map(session => <li key={session.id}><div><strong>{session.device}{session.current ? ' · This session' : ''}</strong><br /><span className="help">Signed in {new Date(session.createdAt).toLocaleString()} · expires {new Date(session.expiresAt).toLocaleString()}</span></div><button disabled={revoke.isPending || all.isPending} onClick={() => revoke.mutate(session)}>{session.current ? 'Revoke this session' : 'Revoke session'}</button></li>)}</ul>}
      {(revoke.isError || all.isError) && <p role="alert" className="error">{errorMessage(revoke.error || all.error)}</p>}<button disabled={all.isPending || revoke.isPending} onClick={() => all.mutate()}>Sign out all sessions</button>
    </section></>
}
