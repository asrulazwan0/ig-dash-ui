# IGDash UI
React + TypeScript + Vite frontend for individual accounts and private logs.

## Current state
A development landing page checks the backend health endpoint and displays connection status. Authentication screens and the log dashboard are not implemented yet.

## Local development
Use Node.js 22.13 or newer within Node 22, or Node 24+ (Node 22 is specified in .nvmrc).
```sh
npm ci
npm run dev
```
Open http://localhost:5173. Run the sibling ig-dash-core API on http://localhost:5193.
Optionally copy .env.example to .env.local to change API_PROXY_TARGET. This is a development server setting, never a browser secret.

## Checks
```sh
npm run lint
npm run build
```
The build includes TypeScript checking. npm run preview previews static assets only; configure a same-origin /api reverse proxy for a deployed build. The development proxy is not included in production assets.

## Documentation
- [MVP scope](docs/mvp.md)
- [Backend architecture and proposed API](https://github.com/asrulazwan0/ig-dash-core/blob/main/docs/api-design.md) (available on GitHub after publishing; locally use ../ig-dash-core/docs/api-design.md).

Use cookie sessions with CSRF protection when authentication is implemented. Do not store tokens in localStorage or expose server credentials via VITE_ variables.
