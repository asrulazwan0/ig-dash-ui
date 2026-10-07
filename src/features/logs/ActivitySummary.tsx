import { useQuery } from '@tanstack/react-query'
import { api, errorMessage, type LogSummary } from '../../lib/api'

export function ActivitySummary({ userId, query }: { userId: string; query: string }) {
  const summary = useQuery({ queryKey: ['logs', userId, 'summary', query], retry: false,
    queryFn: ({ signal }) => api<LogSummary>(`/api/logs/summary?${query}`, { signal }),
  })
  if (summary.isPending) return <p>Loading your summary…</p>
  if (summary.isError) return <div className="panel"><p role="alert">{errorMessage(summary.error)}</p><button onClick={() => { void summary.refetch() }}>Retry summary</button></div>
  const data = summary.data
  const max = Math.max(1, ...data.activity.map(day => day.count))
  return <section className="panel activity-panel" aria-labelledby="summary-title">
    <div className="section-heading"><div><p className="eyebrow">THE BIGGER PICTURE</p><h2 id="summary-title">Activity summary</h2></div><span className="help">Matches your filters</span></div>
    <dl className="summary-counts">{(['total', 'info', 'warning', 'error'] as const).map(level => <div key={level}><dt>{level === 'total' ? 'Total logs' : level}</dt><dd>{data[level]}</dd></div>)}</dl>
    <figure className="activity-chart"><figcaption>Daily activity · {data.chartFrom} to {data.chartTo} (UTC, up to 30 days)</figcaption>
      {data.activity.length ? <div className="chart-bars" role="img" aria-label={`Daily log activity from ${data.chartFrom} to ${data.chartTo}. ${data.activity.reduce((total, day) => total + day.count, 0)} logs.`}>
        {data.activity.map(day => <div className="chart-column" key={day.date} title={`${day.date}: ${day.count} logs`}><div className="chart-bar" style={{ height: `${day.count / max * 100}%` }} /></div>)}
      </div> : <p>No activity in this chart period.</p>}
      <details><summary>View daily counts</summary><table><caption className="sr-only">Daily activity in UTC</caption><thead><tr><th>Date</th><th>Logs</th></tr></thead><tbody>{data.activity.map(day => <tr key={day.date}><td>{day.date}</td><td>{day.count}</td></tr>)}</tbody></table></details>
    </figure>
    <details className="recent-activity"><summary>Recent activity · latest {data.recent.length} matching entries</summary>{data.recent.length ? <ul>{data.recent.map(log => <li key={log.id}><span className={`level ${log.level}`}>{log.level}</span> {log.message}<br /><time dateTime={log.occurredAt}>{new Date(log.occurredAt).toLocaleString()}</time></li>)}</ul> : <p>No matching activity.</p>}</details>
  </section>
}
