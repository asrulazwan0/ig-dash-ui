import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, errorMessage, type LogPage, type Session } from '../../lib/api'
import { LogForm } from './LogForm'

export function Dashboard({ user }: { user: Session }) {
  const [page, setPage] = useState(1)
  const [level, setLevel] = useState('')
  const client = useQueryClient()
  const logs = useQuery({ queryKey: ['logs', user.id, page, level], retry: false,
    queryFn: ({ signal }) => api<LogPage>(`/api/logs?page=${page}&pageSize=25${level ? `&level=${level}` : ''}`, { signal }),
  })
  return <>
    <div className="welcome"><p className="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</p><h1>Your day, in perspective.</h1><p className="muted">Capture what matters. Keep the details yours.</p></div>
    <div className="dashboard-grid"><LogForm onSaved={async () => { setPage(1); await client.invalidateQueries({ queryKey: ['logs', user.id] }) }} />
    <section className="panel history" aria-labelledby="history-title">
      <div className="section-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h2 id="history-title">Log history</h2></div><label className="filter" htmlFor="filter-level">Filter by level<select id="filter-level" value={level} onChange={event => { setLevel(event.target.value); setPage(1) }}><option value="">All levels</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option></select></label></div>
      {logs.isPending && <p role="status">Loading your logs…</p>}
      {logs.isError && <div><p role="alert" className="error">{errorMessage(logs.error)}</p><button onClick={() => { void logs.refetch() }}>Try again</button></div>}
      {logs.data && <>
        <p className="help" role="status">{logs.data.total} {logs.data.total === 1 ? 'log' : 'logs'}{level ? ` · ${level}` : ''}</p>
        {logs.data.items.length === 0 ? <div className="empty"><span aria-hidden="true">＋</span><h3>No logs here yet.</h3><p className="muted">{level ? 'Try another level or add a matching log.' : 'Your first entry starts the story.'}</p></div>
          : <div className="table-scroll"><table><caption className="sr-only">Your private logs, newest first</caption><thead><tr><th scope="col">Message</th><th scope="col">Level</th><th scope="col">Occurred</th></tr></thead><tbody>{logs.data.items.map(log => <tr key={log.id}><td className="message">{log.message}</td><td><span className={`level ${log.level}`}>{log.level}</span></td><td><time dateTime={log.occurredAt}>{new Date(log.occurredAt).toLocaleString()}</time></td></tr>)}</tbody></table></div>}
        <nav className="pagination" aria-label="Log pages"><button disabled={page === 1 || logs.isFetching} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(logs.data.total / 25))}</span><button disabled={page * 25 >= logs.data.total || logs.isFetching} onClick={() => setPage(value => value + 1)}>Next</button></nav>
      </>}
    </section></div>
  </>
}
