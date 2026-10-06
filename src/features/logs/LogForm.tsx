import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, errorMessage } from '../../lib/api'

export function LogForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const form = useRef<HTMLFormElement>(null)
  const [localTime] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16))
  const mutation = useMutation({
    mutationFn: (data: FormData) => api('/api/logs', { method: 'POST', body: JSON.stringify({
      message: data.get('message'), level: data.get('level'), occurredAt: new Date(String(data.get('occurredAt'))).toISOString(),
    }) }),
    onSuccess: async () => { form.current?.reset(); await onSaved() },
  })
  return <section className="panel" aria-labelledby="capture-title">
    <div className="section-heading"><div><p className="eyebrow">CAPTURE THE MOMENT</p><h2 id="capture-title">Add a log</h2></div><span className="badge">Private</span></div>
    <form ref={form} onSubmit={event => { event.preventDefault(); mutation.mutate(new FormData(event.currentTarget)) }}>
      <label htmlFor="message">Message</label><textarea id="message" name="message" rows={3} maxLength={2000} required placeholder="What happened?" />
      <div className="form-row"><div><label htmlFor="level">Level</label><select id="level" name="level" defaultValue="info"><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option></select></div>
        <div><label htmlFor="occurredAt">Occurred at</label><input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={localTime} required /><p className="help">Your local time; stored in UTC.</p></div></div>
      {mutation.isError && <p role="alert" className="error">{errorMessage(mutation.error)}</p>}
      {mutation.isSuccess && <p role="status" className="notice">Log saved.</p>}
      <button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save log'}</button>
    </form>
  </section>
}
