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


## Full Docker development
This repo includes a Dockerfile.dev for source-mounted development. With both repos checked out as siblings under `ig/`, the local parent compose.yaml runs the API, frontend, and PostgreSQL together:
```sh
cd ..
docker compose up --build -d --wait
```
Configure ig-dash-core/.env first. See ../README.md for hot reload, logs, and switching back to native apps. Parent orchestration files are local and are not tracked in either repo yet.
