import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, downloadLogs, errorMessage, type LogPage, type LogRecord, type Session } from '../../lib/api'
import { LogForm } from './LogForm'
import { ActivitySummary } from './ActivitySummary'

type Filters = { level: string; search: string; from: string; to: string; tag: string }
const emptyFilters: Filters = { level: '', search: '', from: '', to: '', tag: '' }
function queryFor(filters: Filters) {
  const query = new URLSearchParams()
  if (filters.level) query.set('level', filters.level)
  if (filters.search.trim()) query.set('search', filters.search.trim())
  if (filters.tag) query.set('tag', filters.tag)
  // Dates are inclusive in the user's local timezone; API upper bounds are exclusive UTC.
  if (filters.from) query.set('from', new Date(`${filters.from}T00:00:00`).toISOString())
  if (filters.to) {
    const date = new Date(`${filters.to}T00:00:00`); date.setDate(date.getDate() + 1)
    query.set('to', date.toISOString())
  }
  return query.toString()
}
export function Dashboard({ user }: { user: Session }) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(emptyFilters)
  const [draft, setDraft] = useState(emptyFilters)
  const [editing, setEditing] = useState<LogRecord>()
  const [deleting, setDeleting] = useState<LogRecord>()
  const [filterError, setFilterError] = useState('')
  const historyTitle = useRef<HTMLHeadingElement>(null)
  const client = useQueryClient()
  const query = queryFor(filters)
  const logs = useQuery({ queryKey: ['logs', user.id, 'list', page, query], retry: false,
    queryFn: ({ signal }) => api<LogPage>(`/api/logs?page=${page}&pageSize=25&${query}`, { signal }),
  })
  const tags = useQuery({ queryKey: ['logs', user.id, 'tags'], retry: false,
    queryFn: ({ signal }) => api<string[]>('/api/logs/tags', { signal }),
  })
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['logs', user.id] }) }
  const remove = useMutation({ mutationFn: (id: string) => api<void>(`/api/logs/${id}`, { method: 'DELETE' }),
    onSuccess: async (_, id) => { if (editing?.id === id) setEditing(undefined); setDeleting(undefined); if (logs.data?.items.length === 1 && page > 1) setPage(value => value - 1); await refresh(); historyTitle.current?.focus() },
  })
  const exporting = useMutation({ mutationFn: () => downloadLogs(query) })
  const updateLevel = (level: string) => { setFilters(value => ({ ...value, level })); setDraft(value => ({ ...value, level })); setPage(1) }
  return <>
    <div className="welcome"><p className="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</p><h1>Your day, in perspective.</h1><p className="muted">Capture what matters. Keep the details yours.</p></div>
    <section className="panel filters-panel" aria-label="Log filters">
      <form className="filters-grid" onSubmit={event => { event.preventDefault(); if (draft.from && draft.to && draft.from > draft.to) { setFilterError('Start date must be on or before end date.'); return } setFilterError(''); setFilters(draft); setPage(1) }}>
        <label>Search messages<input type="search" value={draft.search} maxLength={200} onChange={event => setDraft(value => ({ ...value, search: event.target.value }))} placeholder="Find a moment…" /></label>
        <label>From date<input type="date" min="0001-01-01" max="9999-12-30" value={draft.from} onChange={event => setDraft(value => ({ ...value, from: event.target.value }))} /></label>
        <label>To date<input type="date" min="0001-01-01" max="9999-12-30" value={draft.to} onChange={event => setDraft(value => ({ ...value, to: event.target.value }))} /></label>
        <label>Filter by tag<select value={draft.tag} onChange={event => setDraft(value => ({ ...value, tag: event.target.value }))}><option value="">All tags</option>{Array.from(new Set([...(tags.data || []), ...(draft.tag ? [draft.tag] : [])])).map(tag => <option key={tag} value={tag}>{tag}</option>)}</select></label>
        <div className="form-actions"><button type="submit" className="primary">Apply filters</button><button type="button" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); setFilterError(''); setPage(1) }}>Clear filters</button></div>
      </form>
      {filterError && <p role="alert" className="error">{filterError}</p>}
      {tags.isError && <p role="alert">Unable to load tags. <button onClick={() => { void tags.refetch() }}>Retry tags</button></p>}
    </section>
    <ActivitySummary userId={user.id} query={query} />
    <div className="dashboard-grid"><LogForm key={editing?.id || 'create'} editing={editing} onCancel={() => { setEditing(undefined); historyTitle.current?.focus() }} onSaved={async () => { setEditing(undefined); setPage(1); await refresh(); if (editing) historyTitle.current?.focus() }} />
    <section className="panel history" aria-labelledby="history-title">
      <div className="section-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h2 id="history-title" ref={historyTitle} tabIndex={-1}>Log history</h2></div><label className="filter" htmlFor="filter-level">Filter by level<select id="filter-level" value={filters.level} onChange={event => updateLevel(event.target.value)}><option value="">All levels</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option></select></label></div>
      <button disabled={exporting.isPending} onClick={() => exporting.mutate()}>{exporting.isPending ? 'Exporting…' : 'Export CSV'}</button>
      {exporting.isError && <p role="alert" className="error">{errorMessage(exporting.error)}</p>}
      {logs.isPending && <p role="status">Loading your logs…</p>}
      {logs.isError && <div><p role="alert" className="error">{errorMessage(logs.error)}</p><button onClick={() => { void logs.refetch() }}>Try again</button></div>}
      {logs.data && <>
        <p className="help" role="status">{logs.data.total} {logs.data.total === 1 ? 'log' : 'logs'}{filters.level ? ` · ${filters.level}` : ''}</p>
        {logs.data.items.length === 0 ? <div className="empty"><span aria-hidden="true">＋</span><h3>No logs here yet.</h3><p className="muted">{query ? 'Try different filters or add a matching log.' : 'Your first entry starts the story.'}</p></div>
          : <div className="table-scroll"><table><caption className="sr-only">Your private logs, newest first</caption><thead><tr><th scope="col">Message</th><th scope="col">Level</th><th scope="col">Occurred</th><th scope="col">Actions</th></tr></thead><tbody>{logs.data.items.map(log => <tr key={log.id}><td className="message">{log.message}<div className="tags">{log.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div></td><td><span className={`level ${log.level}`}>{log.level}</span></td><td><time dateTime={log.occurredAt}>{new Date(log.occurredAt).toLocaleString()}</time></td><td><div className="row-actions"><button aria-label={`Edit log: ${log.message}`} onClick={() => { setEditing(log); setDeleting(undefined) }}>Edit</button><button aria-label={`Delete log: ${log.message}`} onClick={() => { remove.reset(); setDeleting(log) }}>Delete</button></div></td></tr>)}</tbody></table></div>}
        <nav className="pagination" aria-label="Log pages"><button disabled={page === 1 || logs.isFetching} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(logs.data.total / 25))}</span><button disabled={page * 25 >= logs.data.total || logs.isFetching} onClick={() => setPage(value => value + 1)}>Next</button></nav>
      </>}
    </section></div>
    {deleting && <DeleteConfirmation log={deleting} pending={remove.isPending} error={remove.isError ? errorMessage(remove.error) : undefined} onConfirm={() => remove.mutate(deleting.id)} onCancel={() => { setDeleting(undefined); historyTitle.current?.focus() }} />}
  </>
}
function DeleteConfirmation({ log, pending, error, onConfirm, onCancel }: { log: LogRecord; pending: boolean; error?: string; onConfirm: () => void; onCancel: () => void }) {
  // Native modal dialog provides keyboard focus trapping and makes background content inert.
  return <dialog ref={node => { if (node && !node.open) node.showModal() }} aria-labelledby="delete-title" onCancel={event => { event.preventDefault(); if (!pending) onCancel() }}>
    <h2 id="delete-title">Delete this log?</h2><p>This permanently removes the entry from your history.</p><p className="delete-preview">{log.message}</p>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="form-actions"><button autoFocus disabled={pending} onClick={onCancel}>Keep log</button><button className="danger" disabled={pending} onClick={onConfirm}>{pending ? 'Deleting…' : 'Confirm delete'}</button></div>
  </dialog>
}
