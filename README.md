# IGDash UI
React + TypeScript + Vite frontend for individual accounts and private logs.

## Current state
Registration, sign-in, restored cookie sessions, and private logs are implemented. The dashboard supports creation, editing, confirmed deletion, private tags, message search, date/level/tag filters, pagination, activity summaries, CSV export, and recoverable failures.

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
Clone both repos as siblings. Configure ig-dash-core/.env, then follow the shared setup in [IGDash Core](https://github.com/asrulazwan0/ig-dash-core#full-docker-development). Its tracked compose.workspace.yaml runs PostgreSQL, API, and this frontend with hot reload.

Browser checks use real API/database services:
```sh
cd ../ig-dash-core
docker compose -f compose.workspace.yaml --profile tools run --build --rm browser-tests
```
The browser image includes Chromium dependencies. Checks create test accounts and logs; CI uses a disposable stack. For an already running app with locally installed Playwright browsers, run npm run test:e2e (BASE_URL defaults to http://localhost:5173).

## Explore demo data
Run the explicit development seeder in the sibling [IGDash Core](https://github.com/asrulazwan0/ig-dash-core#demo-data), then sign in with either demo account and your configured password.

Date filters include both selected dates in your local timezone. Summary counts and recent entries match all applied filters. The daily chart shows up to 30 UTC days ending at the selected end date (or today); expand daily counts for the accessible table. CSV export includes every matching entry, across all pages. Spreadsheet formula-like text is prefixed with an apostrophe for safe viewing.
