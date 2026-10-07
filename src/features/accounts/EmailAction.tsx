import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, errorMessage } from '../../lib/api'

export type EmailLink = { action: string; userId: string; token: string; email: string | null }
export function readEmailLink(): EmailLink | null {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const action = params.get('account-action')
  if (!action) return null
  // Tokens stay in memory for this action; clear the fragment before other requests or navigation.
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return { action, userId: params.get('user') || '', token: params.get('token') || '', email: params.get('email') }
}
export function EmailAction({ link, onDone }: { link: EmailLink; onDone: () => void }) {
  const [complete, setComplete] = useState(false)
  const reset = link.action === 'reset'
  const valid = ['reset', 'verify', 'email-change'].includes(link.action) && Boolean(link.userId && link.token) && (link.action !== 'email-change' || Boolean(link.email))
  const mutation = useMutation({ mutationFn: (form: FormData) => api<void>(`/api/auth/${reset ? 'password/reset' : link.action === 'verify' ? 'verification/confirm' : 'email/confirm'}`, {
    method: 'POST', body: JSON.stringify({ userId: link.userId, token: link.token, ...(reset ? { password: form.get('password') } : {}), ...(link.action === 'email-change' ? { email: link.email } : {}) }),
  }), onSuccess: () => setComplete(true) })
  return <section className="account-card email-action" aria-labelledby="email-action-title"><p className="eyebrow">YOUR ACCOUNT</p>
    <h1 id="email-action-title">{reset ? 'Choose a new password.' : link.action === 'email-change' ? 'Confirm your new email.' : 'Verify your email.'}</h1>
    {complete ? <><p role="status" className="notice">{reset ? 'Password reset. Sign in with your new password.' : link.action === 'email-change' ? 'Email updated. Sign in with your new email.' : 'Email verified. You can now sign in.'}</p><button className="primary" onClick={onDone}>Continue to sign in</button></>
      : !valid ? <><p role="alert" className="error">This link is incomplete. Request a new one.</p><button onClick={onDone}>Back to sign in</button></>
      : <form onSubmit={event => { event.preventDefault(); mutation.mutate(new FormData(event.currentTarget)) }}>
        <p className="muted">Links expire after one hour. Confirm to finish this account action.</p>
        {reset && <><label htmlFor="reset-password">New password</label><input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><p className="help">Uppercase, lowercase, a number, and a symbol; 12–128 characters.</p></>}
        {mutation.isError && <><p role="alert" className="error">{errorMessage(mutation.error)}</p><button type="button" onClick={onDone}>Request a new link</button></>}
        <button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Please wait…' : reset ? 'Reset password' : link.action === 'email-change' ? 'Confirm email change' : 'Confirm email'}</button>
      </form>}
  </section>
}
