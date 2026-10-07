import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, errorMessage, type LogRecord } from '../../lib/api'

export function LogForm({ onSaved, editing, onCancel }: { onSaved: () => Promise<void>; editing?: LogRecord; onCancel?: () => void }) {
  const form = useRef<HTMLFormElement>(null)
  const [localTime] = useState(() => {
    const date = editing ? new Date(editing.occurredAt) : new Date()
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const mutation = useMutation({
    mutationFn: (data: FormData) => api(`/api/logs${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify({
      message: data.get('message'), level: data.get('level'), occurredAt: new Date(String(data.get('occurredAt'))).toISOString(),
      tags: String(data.get('tags') || '').split(',').map(tag => tag.trim()).filter(Boolean),
    }) }),
    onSuccess: async () => { if (!editing) form.current?.reset(); await onSaved() },
  })
  return <section className="panel" aria-labelledby="capture-title">
    <div className="section-heading"><div><p className="eyebrow">CAPTURE THE MOMENT</p><h2 id="capture-title">{editing ? 'Edit log' : 'Add a log'}</h2></div><span className="badge">Private</span></div>
    <form ref={form} onSubmit={event => { event.preventDefault(); mutation.mutate(new FormData(event.currentTarget)) }}>
      <label htmlFor="message">Message</label><textarea id="message" name="message" rows={3} maxLength={2000} required defaultValue={editing?.message} placeholder="What happened?" autoFocus={Boolean(editing)} />
      <div className="form-row"><div><label htmlFor="level">Level</label><select id="level" name="level" defaultValue={editing?.level || 'info'}><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option></select></div>
        <div><label htmlFor="occurredAt">Occurred at</label><input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={localTime} required /><p className="help">Your local time; stored in UTC.</p></div></div>
      <label htmlFor="tags">Tags</label><input id="tags" name="tags" defaultValue={editing?.tags.join(', ')} placeholder="work, learning" maxLength={320} /><p className="help">Up to 10 comma-separated tags. Letters, numbers, hyphens, underscores; 30 characters each.</p>
      {mutation.isError && <p role="alert" className="error">{errorMessage(mutation.error)}</p>}
      {mutation.isSuccess && !editing && <p role="status" className="notice">Log saved.</p>}
      <div className="form-actions"><button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save log'}</button>
        {editing && <button type="button" disabled={mutation.isPending} onClick={onCancel}>Cancel edit</button>}</div>
    </form>
  </section>
}
