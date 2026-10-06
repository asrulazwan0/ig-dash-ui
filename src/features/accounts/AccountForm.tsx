import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, errorMessage } from '../../lib/api'

export function AccountForm({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [notice, setNotice] = useState('')
  const mutation = useMutation({
    mutationFn: async (data: FormData) => api<void>(`/api/auth/${mode}`, {
      method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
    }),
    onSuccess: async () => {
      if (mode === 'register') { setMode('login'); setNotice('Account created. Sign in to get started.') }
      else await onSignedIn()
    },
  })
  return <section className="account-card" aria-labelledby="account-title">
    <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
    <h2 id="account-title">{mode === 'login' ? 'Welcome back.' : 'Make room for clarity.'}</h2>
    <p className="muted">{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Create an account to keep your logs in one place.'}</p>
    <form onSubmit={event => { event.preventDefault(); setNotice(''); mutation.mutate(new FormData(event.currentTarget)) }}>
      <label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" maxLength={254} required />
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={12} maxLength={128} required aria-describedby="password-help" />
      <p id="password-help" className="help">12+ characters, with uppercase, lowercase, a number, and a symbol.</p>
      {mutation.isError && <p role="alert" className="error">{errorMessage(mutation.error)}</p>}
      {notice && <p role="status" className="notice">{notice}</p>}
      <button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <button className="text-button" disabled={mutation.isPending} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); mutation.reset(); setNotice('') }}>
      {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
    </button>
  </section>
}
