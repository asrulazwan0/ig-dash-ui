import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, errorMessage } from '../../lib/api'

type Mode = 'login' | 'register' | 'forgot' | 'verify'
export function AccountForm({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [mode, setMode] = useState<Mode>('login')
  const [notice, setNotice] = useState('')
  const mutation = useMutation({
    mutationFn: async (data: FormData) => api<void>(`/api/auth/${mode === 'forgot' ? 'password/forgot' : mode === 'verify' ? 'verification/request' : mode}`, {
      method: 'POST', body: JSON.stringify({ email: data.get('email'), ...(['login', 'register'].includes(mode) ? { password: data.get('password') } : {}) }),
    }),
    onSuccess: async () => {
      if (mode === 'register') { setMode('login'); setNotice('Account created. Check your email to verify it before signing in.') }
      else if (mode === 'forgot' || mode === 'verify') setNotice('If this account is eligible, an email has been sent. Check your inbox; you can request another after one minute.')
      else await onSignedIn()
    },
  })
  const change = (next: Mode) => { setMode(next); mutation.reset(); setNotice('') }
  return <section className="account-card" aria-labelledby="account-title">
    <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
    <h2 id="account-title">{mode === 'login' ? 'Welcome back.' : mode === 'register' ? 'Make room for clarity.' : mode === 'forgot' ? 'Reset your password.' : 'Verify your email.'}</h2>
    <p className="muted">{mode === 'forgot' ? 'Request a link to choose a new password.' : mode === 'verify' ? 'Request a new verification link.' : mode === 'register' ? 'Create an account to keep your logs in one place.' : 'Sign in to pick up where you left off.'}</p>
    <form onSubmit={event => { event.preventDefault(); setNotice(''); mutation.mutate(new FormData(event.currentTarget)) }}>
      <label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" maxLength={254} required />
      {(mode === 'login' || mode === 'register') && <><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={12} maxLength={128} required aria-describedby="password-help" />
      <p id="password-help" className="help">12+ characters, with uppercase, lowercase, a number, and a symbol.</p></>}
      {mutation.isError && <p role="alert" className="error">{errorMessage(mutation.error)}</p>}
      {notice && <p role="status" className="notice">{notice}</p>}
      <button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Send verification link'}</button>
    </form>
    <div className="account-links">
      <button className="text-button" disabled={mutation.isPending} onClick={() => change(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
      {mode === 'login' && <><button className="text-button" disabled={mutation.isPending} onClick={() => change('forgot')}>Forgot password?</button><button className="text-button" disabled={mutation.isPending} onClick={() => change('verify')}>Resend verification email</button></>}
    </div>
  </section>
}
