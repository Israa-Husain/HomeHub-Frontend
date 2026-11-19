# Phase 5 implementation and verification

Phase 6 follow-up: the browser-local timestamp bug described among the limitations below has been corrected using shared Bahrain-time helpers. Current results are **163 isolated backend tests, 9 frontend tests, 68 of 70 read-only live HTTP checks and public/negative-authentication browser checks passed**. Two malformed-body probes still return 500 until a controlled backend reload loads the tested handler correction. Authenticated mutations, PostgreSQL concurrency and deployed SSE remain blocked. See the consolidated local-workspace [Phase 6 report](../../HomeHub/docs/PHASE-6-FINAL-VERIFICATION.md), including the scheduling-registration finding. The body below retains the Phase 5 review record.

All changes remain uncommitted. No branches, commits, pushes, database migrations, seed activation, account creation or credential resets were performed during this phase. Backend security and `.gitattributes` were not changed.

## Backend prerequisite

The approved booking eligibility correction extends only `BookingService` and the existing `HomeHubServiceTest`. Creation and appointment discovery reuse one local eligibility helper. Creation refreshes service, category, provider profile and provider account after its existing provider lock, rejecting inactive services/categories, unapproved providers and inactive provider accounts. Pricing, notice, overlap, time-off, waitlist and transaction behavior remain in place. No new production class, endpoint or entity was needed. A private helper in a different service was not made public solely to add a cross-service dependency.

Installed Maven 3.9.16, offline package using these selected test classes:

```text
HomeHubServiceTest,AvailabilityServiceTest,AvailabilityBookingControllerTest,
ServiceProviderApiTest,ServiceProviderControllerTest,EmailConcurrencyTest,
BookingRescheduleServiceTest,BookingWaitlistServiceTest,RescheduleWaitlistControllerTest,
ServiceFeedbackServiceTest,ServiceFeedbackControllerTest,NotificationApiTest
```

Result: **156 tests passed, zero failures/errors/skips; package BUILD SUCCESS**. Backend log: `target/eligibility-regression-package.log`. The five new tests cover each eligibility state initially and after discovery, plus refresh order after acquiring the lock. These are unit/MVC tests, not live PostgreSQL concurrent requests. See the backend's `docs/BOOKING-ELIGIBILITY-CORRECTION.md`.

## Frontend files and reuse

| Files | Implementation and real API integration |
|---|---|
| `src/pages/Services.jsx` | Existing browse/search retained. Service details use provider IDs/status/emergency flags and link to provider profiles/reviews. Booking selects `GET /booking/available-times` suggestions; create and waitlist requests use existing endpoints. Home ownership, eligibility and final price remain server decisions. |
| `src/pages/Provider.jsx` | Existing profile create/read extended with business update and prefilled portfolio/preferences. Provider details display business/portfolio text, provider-filtered services and reviews. Owned services use paginated `GET /services/mine`, including inactive services; existing create/update/deactivate forms now send category IDs and emergency opt-in. Availability reads both published periods and owned `timeOff=true` blocks; existing create, time-off, PUT and DELETE operations are wired. |
| `src/pages/Reschedules.jsx` (new) | One shared homeowner/provider list/detail/card implementation replaces manual-ID-only decisions. Uses scoped `GET /reschedules`, `GET /reschedules/{id}`, and provider decision PUT. Lists refresh from backend after decisions, showing current/proposed appointments and statuses. Shared screen avoids duplicating the workflow across role pages, dashboard and booking details. |
| `src/pages/Bookings.jsx` | Existing booking list, cancellation, decisions, reports, assessments and reviews retained. Adds response/report deadlines, late cancellation, created time, paginated `GET /booking/{id}/history`, per-booking reschedules and own-review duplicate awareness. Providers complete only after retrieving a report. Dashboard shows real bookings, requests/offers and notifications; admin counts use actual user/application page totals. |
| `src/pages/Admin.jsx` | Provider applications use paginated/status-filtered list, inspected detail and existing approve endpoint with confirmation. Pending applications alone have an approval control; suspended records remain inspectable. Existing user deactivation and category management retained. |
| `src/pages/Saved.jsx` | Existing favorites/claim/leave/history/read workflows retained. Offers show exact returned `offerExpiresAt` plus informational countdown. Homeowner submitted reviews use paginated `/reviews/mine`; provider reviews use linked/profile IDs and omit private booking identifiers. |
| `src/App.jsx`, `src/components/Layout.jsx` | Add guarded provider details and homeowner/provider reschedule routes/navigation; keep all marketplace routes authenticated. |
| `src/components/Common.jsx`, `src/styles/global.css` | Reuse existing forms, fields, actions, cards, notices and badges. Add shared pagination and optional background content preservation to avoid erasing booking-form input on notification refresh. Add modest text/history styles. |
| `src/context/NotificationContext.jsx` | Existing persistent history/count/read and authenticated streaming-fetch implementation retained. Normalize SSE CRLF after appending chunks so a CRLF split across network chunks is handled. Existing reconnect/abort/60-second refresh remain. |
| `docs/generate-inventory.mjs`, contract snapshot/tests | Reuse inventory generator; default generation uses inspected sibling source inventory, `--live` additionally fetches OpenAPI. Tests retain prior coverage and add method/path checks, 70-operation request-path accounting and live-schema agreement. |
| README and documentation | Current setup, routes, limitations and verification recorded. Pre-Phase-1 gap/verification documents explicitly marked historical rather than presented as current blockers. |

No new frontend dependencies were introduced. API calls continue using existing Axios helpers, JWT interceptors, AuthContext and resource hook. No production mock responses or invented platform records were added. No backend method was made obsolete or removed by Phase 5.

## Route coverage

| Access | Routes |
|---|---|
| Public | `/`, `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password`, not-found |
| Authenticated | `/dashboard`, `/services`, `/services/:id`, `/providers/:id`, `/bookings`, `/bookings/:id`, `/account`, `/notifications`, `/reviews` |
| HOMEOWNER | `/homes`, `/favorites`, `/waitlist`; `/reschedules`, `/reschedules/:id`; completed booking review forms |
| PROVIDER | `/provider/profile`, `/provider/services`, `/provider/availability`, `/provider/reschedules`; shared `/reschedules`, `/reschedules/:id`; assigned booking report/assessment forms |
| ADMIN | `/admin/users`, `/admin/providers`, `/admin/categories`; authorized booking ID lookup, status/cancellation and recorded history |

The API inventory accounts for **70 operations across 16 controllers**. Request-path/static coverage is not proof of successful execution of every endpoint. Consult `API-INVENTORY.md`, `backend-contracts.json` and the refreshed live `openapi.json` for exact contracts.

## Executed frontend checks

- `npm.cmd install`: completed; 98 packages audited, zero reported vulnerabilities. An existing npm environment warning about `min-release-age` does not affect the build.
- `npm.cmd run build`: final production Vite compilation passed (1,668 modules transformed).
- `npm.cmd run inventory -- --live`: source inventory regenerated and actual running OpenAPI snapshot refreshed. Server exposes all 70 expected operations and enriched DTO schemas.
- `npm.cmd test`: **7 tests passed, zero failures**. Tests inspect paths and methods, including conditional availability endpoints and SSE path accounting; they are not successful mutation tests.
- `npm.cmd run test:browser`: real installed Chrome, no API mocking. Seven public/not-found routes at 1440/768/390 px showed no horizontal page overflow; all 21 protected route samples redirected to login; empty registration failed native validation without creating an account.
- Against the real server: nonexistent-account login returned **401**, invalid verification returned **404**, errors were visible, email input was preserved, and no session was created. Invalid restored JWT was cleared and redirected. No JavaScript runtime exceptions occurred in these executed checks.
- Browser screenshots and observed results are under ignored `test-results/`. Authenticated role pages were explicitly reported **NOT RUN** because verified credentials were unavailable.
- Babel scope inspection found no unused frontend imports; `git diff --check` reported no whitespace errors. The mobile home screenshot was inspected visually. Authenticated layouts remain pending real accounts.

## Runtime observations and remaining blockers

Port 8070 currently serves OpenAPI and protected profile requests correctly require authentication. The first short probe timed out; a longer probe and rerun succeeded. PostgreSQL listens on 5432. The unknown-user and invalid-token requests exercise database-backed lookups and returned expected application errors, rather than HTTP 500. This is evidence of those running-server paths, not proof of the intended database/profile or every repository operation.

The shell still has no `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `MAIL_USERNAME` or `MAIL_PASSWORD` values. The previous application-context PostgreSQL authentication failure has not been resolved for that test environment. The IDE-running server can have a different configured environment. No configuration was bypassed or real secrets hardcoded. The earlier demo homeowner 401 has not been attributed to existence, verification, active state or password mismatch; a 401 alone is insufficient to determine those facts.

Verified existing HOMEOWNER, PROVIDER and ADMIN test credentials are required for live role tests. The browser runner accepts `TEST_<ROLE>_EMAIL` and `TEST_<ROLE>_PASSWORD` in its inherited environment; never commit them. A secure existing local configuration has been requested. No test accounts have been invented, reset or seeded.

Still pending with real accounts and the intended PostgreSQL configuration:

| Workflow | Required live verification |
|---|---|
| Authentication/account | Successful role login/refresh/logout, denied role URLs, expiry/deactivation, registration/mail verification, recovery/reset/change, profile and image upload/serving |
| Booking | Normal/emergency create and final price, all eligibility changes after discovery, cancellation/late status, provider decisions/deadlines, history authorization/pagination |
| Concurrency | Real overlapping PostgreSQL booking, reschedule and waitlist-claim requests; verify only eligible requests succeed under database locks |
| Provider | Business/portfolio preferences; owned inactive service edits and emergency configuration; availability/block listing, update/removal and booking conflicts |
| Reschedules/waitlist | Scoped list/details, duplicate and stale requests, approval/rejection and unchanged original before approval; FIFO offer/release, exact expiration, claim/leave/expired/concurrent outcomes |
| Reports/reviews/assessments | Report privacy, submission after end, report-before-completion and deadlines; own/public review privacy/duplicates/rating limits; assessment booking relationship restrictions |
| Admin | Real application queue/detail and pending approval, paginated user details/deactivation, category mutation and protected booking lookup |
| Notifications | Persistent history/count/read after refresh; actual transaction events through authenticated SSE, reconnect/chunk handling and cleanup; scheduled deadlines/expiration events |
| UI | Authenticated desktop/tablet/mobile layouts, keyboard navigation, backend field/conflict errors, success/data refresh and repeated-action prevention |

These tests have not passed merely because the app builds or API paths match.

## Contract limits preserved

- Marketplace browsing remains JWT-protected. No anonymous security change was made.
- Admin does not have a global booking/service administration API, general audit/settings API, user reactivation or provider rejection workflow. Do not simulate them. Pending provider approval is exposed; suspended statuses can be inspected without adding a reactivation action.
- Portfolio is existing text/preferences, not an image gallery. Account profile-picture upload remains supported.
- Reports are participant-only; assessments are provider-only with existing booking relationship/status restrictions. No admin override was invented.
- Audit records contain only stored actions/timestamps/actors and known target statuses; unrecorded previous statuses or expiration events are not fabricated. Reschedule booking fields show the current appointment, not an immutable original snapshot.
- Backend local dates/times contain no offset. Exact expiration strings are displayed unchanged. Countdown and native time validation assume matching browser/backend time zones; server decisions remain authoritative. A cross-time-zone demonstration needs the timezone convention confirmed.
- The backend does not return a notification creation timestamp; the frontend does not invent one. Email request success is not presented as proof of delivery.

Suggested commits, **not executed**:

```text
fix: align booking creation with discovery eligibility
feat: integrate HomeHub role workflows with completed backend APIs
```
