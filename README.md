# HomeHub Frontend

A React and JavaScript frontend for the existing HomeHub Project 3 Spring Boot API. It uses Vite, React Router, Axios, React Context, Lucide icons, native forms, and plain CSS. All displayed records come from the backend. There are no mock API handlers or fabricated platform statistics.

**Status:** builds successfully and covers the available controller operations. Full end-to-end acceptance is pending verified test accounts and the backend gaps listed in [BACKEND-GAPS.md](docs/BACKEND-GAPS.md). This is not a claim that all authenticated workflows have passed integration testing.

## Run locally

Use Node.js 22.12+ (Node 24 was used for verification).

```powershell
cd C:\Users\HP\jdb\projects\HomeHub-Frontend
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. Keep the existing Spring Boot backend running on **http://localhost:8070** with its normal PostgreSQL, JWT, and mail environment settings. Start the backend using its existing IntelliJ run configuration or the instructions in its own README. This frontend does not change the backend, database schema, seed profile, or server configuration.

On Windows, `npm.cmd` avoids PowerShell execution-policy restrictions on `npm.ps1`. On other shells use `npm`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Browser API base URL, including `/api` |
| `API_PROXY_TARGET` | `http://localhost:8070` | Vite development/preview proxy destination |

The Vite proxy forwards `/api` and `/uploads`, allowing local use without backend CORS changes. Restart Vite after environment changes. Production hosting must serve `dist`, fall back to `index.html` for React routes, and reverse-proxy `/api` and `/uploads` to Spring Boot. An absolute API URL requires appropriate backend CORS configuration, which is not present in the inspected security setup. Never put secrets in `VITE_*` variables; they are public bundle configuration.

```powershell
npm.cmd run build
npm.cmd run preview
```

Preview runs at http://127.0.0.1:4173. It is for local build inspection, not a production server.

## Project structure

```text
src/
  api/             Axios instance, token interceptor, request helpers, auth/booking APIs
  components/      Layout, form fields, action forms/buttons, cards, notices, badges
  context/         Authentication and persistent/live notification state
  hooks/           Loading/error/data lifecycle helper
  pages/           Public, auth, homeowner, provider, and admin screens
  routes/          Login and role guards
  styles/          Responsive global CSS
  utils/           Booking rules and display helpers
  App.jsx          Route definitions
  main.jsx         Provider composition and entry point
docs/              API inventory, OpenAPI snapshot, backend gaps, verification
tests/             Contract checks, booking validation checks, real-browser smoke checks
```

Page files group closely related screens to keep the project small. The API helpers return response data, including handling empty 204 responses without attempting JSON parsing. Forms preserve their inputs on errors, lock submissions, use native constraints, display backend messages, and attach field-specific server validation to the corresponding input when supplied as `field: message`.

## Roles and routes

| Role | Routes and operations |
|---|---|
| Public | `/`, `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password` |
| All authenticated roles | `/dashboard`, `/services`, `/services/:id`, `/bookings`, `/bookings/:id`, `/account`, `/notifications`, `/reviews` |
| HOMEOWNER | `/homes`, `/favorites`, `/waitlist`; booking requests, cancellations, reschedule requests, completed-booking reviews |
| PROVIDER | `/provider/profile`, `/provider/services`, `/provider/availability`, `/provider/reschedules`; assigned booking decisions, service reports and private assessments |
| ADMIN | `/admin/users`, `/admin/providers`, `/admin/categories`; user deactivation, provider approval by profile ID, categories; authorized booking lookup/status changes/cancellation |

Browsing is protected because the actual backend requires authentication. Admin booking lists return the current user's own bookings; the UI offers lookup by booking ID for administrative access. Service, provider approval, review, and reschedule ID entry screens are honest workarounds for missing lookup endpoints, not searchable directories.

## Authentication

Login returns `{token,type}`. The frontend obtains the role and current account status from `GET /api/users/profile`. The token is stored in `sessionStorage` for same-tab refresh restoration and attached as `Authorization: Bearer ...`. Closing the tab ends local persistence. Logout clears local session state; the backend has no logout/revocation or refresh-token endpoint. All application JavaScript can access session storage, so protect the deployment against script injection and use HTTPS. No tokens or passwords are logged.

Protected 401 responses clear the session. A 403 displays a permission error. The backend loads the user from the database for every valid JWT and rejects inactive accounts. Route guards are only a user-interface layer; authorization remains server-side.

Registration uses the actual `firstname` field spelling. Verification emails link to the backend's `/api/auth/verify?token=...`, which directly verifies the email and returns JSON. Users can then sign in. `/verify` also accepts a token manually or as `?token=...`. Password-reset emails contain a token rather than a frontend link; enter it at `/reset-password`.

## Booking and after-service workflows

Select a service, an active owned home, date, requested start time, and booking type. The API omits the provider ID from services, so available slots cannot currently be discovered automatically from that selection. The frontend labels the time as requested and the price as estimated. The backend validates notice, provider/service eligibility, time off, overlaps, offers, and final price. Normal bookings require 24 hours' notice. Emergency estimates include 20%; eligibility is checked on submission and cannot be configured per service through the current API.

Provider transition buttons follow the implemented state graph. Completion is offered to providers only after a report has been retrieved successfully. Reports can be submitted after the appointment ends for confirmed/awaiting-report bookings. Admin completion is sent to the backend, which checks for the report. Assessments are visible only to providers reviewing pending bookings and submitted only after completion. Reviews are submitted only for completed homeowner bookings; duplicate checks remain server-side.

Waitlist joining is available from the service booking form. Claim/leave actions use current backend statuses; claims are confirmed only after successful API responses. Expiration countdowns are unavailable because the response omits the timestamp.

## Notifications

Notification history and unread counts are loaded from persistent endpoints. The SSE implementation uses streaming `fetch` because native `EventSource` cannot attach the required Bearer header. It parses SSE records across chunks, refreshes history on events, reconnects with bounded exponential backoff, and aborts connections on logout/unmount. A 60-second refresh picks up scheduled status changes and keeps history available during reconnects. No browser task reproduces backend scheduling or email delivery.

## Verification

```powershell
npm.cmd test
npm.cmd run build
# With frontend and backend running, and Chrome installed:
npm.cmd run test:browser
```

`BROWSER_CHANNEL=msedge` can select installed Edge. `FRONTEND_URL` overrides the browser-test base URL. Optional `TEST_HOMEOWNER_EMAIL`, `TEST_HOMEOWNER_PASSWORD`, `TEST_PROVIDER_EMAIL`, `TEST_PROVIDER_PASSWORD`, `TEST_ADMIN_EMAIL`, and `TEST_ADMIN_PASSWORD` environment variables enable authenticated browser checks. Do not commit credentials. Authenticated browser checks verify sign-in, refresh restoration, role pages, and sign-out; they do not claim full mutation workflow coverage.

The browser checks use the real backend. No records are created by the default checks; they exercise required fields, invalid login/verification, and invalid sessions. Reports and screenshots are saved under ignored `test-results/`. See [VERIFICATION.md](docs/VERIFICATION.md) for observed results and the remaining manual workflow matrix.

## API documentation

[API-INVENTORY.md](docs/API-INVENTORY.md) accounts for all **59 operations across 16 controllers**, including roles, request parameters, request/response schema names, controller map fields, and consuming screens. [openapi.json](docs/openapi.json) preserves the full schema definitions from the live backend. `npm.cmd run inventory` refreshes these documents when the sibling backend source and server are available. Review service-level authorization as well as OpenAPI annotations when updating contracts.

This is a separate Git repository. No GitHub remote or push was configured.
