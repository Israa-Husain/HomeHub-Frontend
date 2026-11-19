# HomeHub frontend

React, Vite, Axios and React Router frontend for HomeHub's Bahrain home services.

## Run locally

Start Auth on port 8081, Booking on 8082 and Notification on 8083 using the backend repository. Run these commands from the frontend repository:

```powershell
cd C:\Users\HP\jdb\projects\HomeHub-Frontend
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:5173`. Port 5173 is strict and is the origin all three backend services allow by default. If dependencies are already installed, skip `npm.cmd ci`.

| Vite variable | Local default |
|---|---|
| `VITE_AUTH_API_BASE_URL` | `http://localhost:8081` |
| `VITE_BOOKING_API_BASE_URL` | `http://localhost:8082` |
| `VITE_NOTIFICATION_API_BASE_URL` | `http://localhost:8083` |

The defaults also appear in `.env.example`. Use a local Vite env file or the environment of the AWS build to override these public service URLs. Use HTTPS URLs for an HTTPS deployment and allow the deployed frontend origin on each service. Vite embeds these values at build time, so rebuild after changing them. Keep all credentials out of `VITE_*` variables. If you use `npm.cmd run preview`, allow `http://localhost:4173` on each service as well.

Run `npm.cmd run build` and `npm.cmd test` from the same folder. With the dev server running, `npm.cmd run test:browser` runs public-route and validation checks. It checks live Auth failures when Auth is reachable and runs the read-only signed-in role checks when all three services and the corresponding `TEST_<ROLE>_EMAIL` and `TEST_<ROLE>_PASSWORD` are available.

## Roles and routes

| Access | Main routes |
|---|---|
| Public | `/`, `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password` |
| Authenticated | `/dashboard`, `/services`, `/services/:id`, `/providers/:id`, `/bookings`, `/bookings/:id`, `/account`, `/notifications`, `/reviews` |
| Homeowner | `/homes`, `/favorites`, `/waitlist`, `/reschedules`, `/reschedules/:id` |
| Provider | `/provider/profile`, `/provider/services`, `/provider/availability`, `/provider/reschedules`; also shared reschedule list/detail |
| Admin | `/admin/users`, `/admin/providers`, `/admin/categories` |

Marketplace reads remain authenticated. Role guards complement existing backend authorization. JWT is held in sessionStorage and sent in a Bearer header. Protected 401 responses from the current token clear the session; stale responses cannot clear a newer token. Connection failures during restoration offer retry. There is no refresh-token or server-side logout/revocation endpoint.

Registration sends the existing `firstname` spelling. Verification emails target the backend URL and may return JSON; return to frontend login afterward. The frontend also has a manual verification-token form. Password-reset mail supplies a token for `/reset-password`. Delivery depends on the Notification service mail configuration; no resend-verification endpoint exists.

## Business rules and API limits

Prices use **BHD with three decimal places**. Dates/deadlines/countdowns display **Asia/Bahrain (UTC+3)**, including offset-free backend timestamps. API payload formats are unchanged. The backend's local clock must also be Bahrain-equivalent.

Normal bookings, reschedules and waitlists need at least 24 hours' notice; emergency bookings require a future time and add 20%. Requests/claims start pending and require provider acceptance. Availability is rechecked by the server. Reports require an ended confirmed/awaiting-report appointment and precede completion. Reviews require a completed booking. Assessment reads are assigned-provider-only on pending bookings and writes are assigned-provider-only on completed bookings.

No provider rejection, service/user/category reactivation, portfolio image upload, report/review editing, global admin booking directory, fabricated historical snapshots or invented notification timestamps were added. Inactive homes cannot be fetched for historical address display. Category lists include active records only. Completed-booking assessment reads are unsupported, so duplicate protection after revisiting remains server-side. Timer-driven transitions, reminders and waitlist offer advancement depend on backend scheduling.

## Historical monolith handoff

These documents and the Phase 6 API check record the previous integration with port 8070.

- [Final verification and remaining blockers](docs/STEP-6-HANDOFF.md)
- [Original backend/frontend startup and database identity](docs/ORIGINAL-ENVIRONMENT.md)
- [Role-by-role manual testing guide](docs/MANUAL-TESTING-GUIDE.md)
- [API inventory](docs/API-INVENTORY.md), [machine-readable contracts](docs/backend-contracts.json), and [OpenAPI snapshot](docs/openapi.json)
- Earlier improvement steps: [1](docs/STEP-1-DESIGN.md), [2](docs/STEP-2-AUTH-ACCOUNT.md), [3](docs/STEP-3-HOMEOWNER.md), [4](docs/STEP-4-PROVIDER.md), [5](docs/STEP-5-ADMIN.md)
