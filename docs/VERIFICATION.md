# Verification record

Verified in the supplied Windows workspace against the existing server at localhost:8070. Node 24.13.0; npm 11.6.2. No backend files were modified, and no database setup or seed execution was performed.

## Observed passing checks

- `npm.cmd install`: completed; zero reported vulnerabilities.
- `npm.cmd run build`: production compilation succeeded.
- `npm.cmd test`: four checks passed (terminal booking transitions, booking notice/emergency future time, frontend API path matching, complete endpoint inventory coverage).
- Running `/v3/api-docs`: HTTP 200; inventory generated for 59 operations and all 16 controllers. Controller mappings and DTO fields were inspected directly; API snapshot schema definitions are committed.
- Real Chrome headless browser: all seven public/not-found routes loaded at 1440, 768, and 390 px with no horizontal page overflow.
- All 18 protected paths redirected unauthenticated visitors to login.
- Registration required fields blocked an empty submission without creating an account.
- Real failed login displayed the backend error, preserved entered email, and created no session.
- Invalid verification token displayed a real backend error.
- A deliberately invalid restored token was rejected, cleared, and redirected to login.
- No browser runtime exceptions occurred in the executed checks.
- Mobile home screenshot inspected visually. Browser screenshots and raw results are in ignored `test-results/`.

## Not verified

The source's seeded demo homeowner credentials returned 401. No valid HOMEOWNER, PROVIDER, or ADMIN credentials were available at the time of these checks. Consequently, authenticated successful login/logout, role navigation rendering, record mutations, success flows, SSE event delivery/reconnection, upload serving, and authenticated mobile screens remain unverified at runtime. Route and API source inspection, native constraints, and successful compilation do not establish these integrations passed.

No API mocking, fake accounts, token forging, database edits, email verification bypass, or backend configuration changes were used.

## Manual integration checklist

Use an isolated development database and verified test accounts. Confirm the backend timezone and browser local timezone agree; API dates/times have no zone offset. Backend results are authoritative when clocks differ.

| Area | Checks to perform with real accounts |
|---|---|
| Authentication | Register both allowed roles; verify actual email; sign in; refresh; sign out; wrong password; expired token; inactive account; role-denied URL; password recovery/reset/change |
| Homes/profile | Add, view, edit, deactivate home; confirm active home selector; edit profile; upload valid JPG/PNG/WEBP; reject wrong signature and oversize files |
| Services | Real paginated browse/search, price bounds, category/sort filters, detail lookup, favorites add/list/remove; confirm inactive category cannot enter booking form |
| Normal booking | Valid available time over 24h away; past and insufficient notice; inactive home/service; unapproved provider; overlap, time off, active-offer conflicts; confirmed final price |
| Emergency | Existing service AND provider enabled; disabled eligibility; future same-day appointment; confirmed 20% surcharge; note service opt-in cannot be set through current endpoints |
| Booking decisions | Pending confirm/reject/cancel; response deadline rejection; confirmed awaiting report; homeowner late cancellation; terminal-state action restrictions; admin authorized lookup/status |
| Reschedule | Submit over-24h proposal; duplicate pending rejection; note returned ID; provider approve/reject by ID; verify resulting booking; stale/overlapping proposals rejected; list/history currently blocked |
| Waitlist | Join occupied appointment; duplicate rejection; leave; release appointment from another booking; persistent offered status and notification; claim; expired/concurrent claim rejection; expiry countdown currently blocked |
| Reports | Private participant reads; reject before appointment end; submit work/materials/recommendation; reject duplicate; block completion without report; complete after report; overdue notification |
| Assessments | Submit after completion; duplicate/rating rejection; review homeowner assessments only as assigned provider for pending booking; reject homeowner/admin/private read attempts |
| Reviews | Completed booking review; bounds 1–5; duplicate rejection; provider reviews by profile ID; submitted review retrieval limitations |
| Provider | Create profile; approval status; text portfolio/preferences replacement; services create/update/deactivate by ID; publish/remove availability; overlap protection; time-off creation; missing listing limitations |
| Admin | Paginated users/details; deactivate test user and invalidate existing token; approve provider profile by ID; category create/read/update/deactivate; backend-only limitations |
| Notifications | Persisted history after refresh; unread count; mark read; receive named `booking` SSE event; chunk parsing; reconnect; multiple tabs; logout/unmount cleanup; 60-second refresh |
| Error/loading | 400/401/403/404/409/422/429/500; offline server; slow requests; repeated submit lock; input retention; field message; 204 delete/password actions |
| Responsive | Repeat authenticated role workflows at desktop, tablet, and mobile widths; keyboard focus, sidebar scroll, forms, cards, tables, long validation messages |

## Remaining acceptance limits

See [BACKEND-GAPS.md](BACKEND-GAPS.md). The frontend is ready for credentialed integration testing, but the original complete-workflow acceptance criteria are not yet fulfilled. Backend retrieval/metadata gaps need approved backend changes before those experiences can be completed.
