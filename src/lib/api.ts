export type Session = { id: string; email: string }
export type LogRecord = { id: string; message: string; level: 'info' | 'warning' | 'error'; occurredAt: string; createdAt: string; tags: string[] }
export type LogPage = { items: LogRecord[]; page: number; pageSize: number; total: number }
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.method && options.method !== 'GET') {
    const response = await fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store', signal: options.signal })
    if (!response.ok) throw new ApiError(response.status, 'Unable to verify this request. Try again.')
    const data: { token: string } = await response.json()
    headers.set('X-CSRF-TOKEN', data.token)
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(path, { ...options, headers, credentials: 'same-origin', cache: 'no-store' })
  const text = await response.text()
  let body: unknown
  try { body = text ? JSON.parse(text) : undefined } catch { body = undefined }
  if (!response.ok) {
    let message = 'Unable to complete this request. Try again.'
    if (body && typeof body === 'object') {
      const problem = body as { title?: string; errors?: Record<string, string[]> }
      message = problem.errors ? Object.values(problem.errors).flat().join(' ') : problem.title || message
    }
    if (response.status === 401 && !['/api/auth/me', '/api/auth/login'].includes(path)) {
      window.dispatchEvent(new Event('session-expired'))
    }
    throw new ApiError(response.status, message)
  }
  return body as T
}
export async function getSession(signal?: AbortSignal): Promise<Session | null> {
  try { return await api<Session>('/api/auth/me', { signal }) }
  catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error }
}
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Try again.' }

export type LogSummary = { total: number; info: number; warning: number; error: number; chartFrom: string; chartTo: string;
  activity: { date: string; count: number }[]; recent: LogRecord[] }
export async function downloadLogs(query: string) {
  const response = await fetch(`/api/logs/export?${query}`, { credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('session-expired'))
    const problem = await response.json().catch(() => ({})) as { title?: string }
    throw new ApiError(response.status, problem.title || 'Unable to export logs. Try again.')
  }
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = 'igdash-logs.csv'
  document.body.append(anchor); anchor.click(); anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
