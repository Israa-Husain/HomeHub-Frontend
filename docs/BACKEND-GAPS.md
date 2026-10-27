# Backend gaps and concrete integration proposal

These findings come from the actual controller, DTO, entity, repository, security, and service sources and the running OpenAPI document. No backend files were changed. Backend changes require the project owner's approval.

| Gap | Current frontend behavior | Proposed backend work for approval |
|---|---|---|
| All discovery/review/category routes require authentication | Public home links to sign-in-protected services; no fabricated featured categories | Decide whether selected read endpoints should be public; update security only if intended |
| `ServiceResponse` contains names but no provider/category IDs, status, or emergency flags | Display returned fields; accept a requested time; check active category names before offering the booking form | Add `providerId`, `categoryId`, service/category/provider status, and service/provider emergency flags to the response |
| No free-slot endpoint; availability endpoint returns published windows without booking overlap subtraction | Never label a requested time as guaranteed free | Add authenticated service/date slot lookup incorporating service duration, bookings, time off, and active offers; booking remains transactional authority |
| Service listing filters ACTIVE services but not approved providers or active categories | Category controls use active categories; backend decides request eligibility. Provider eligibility cannot be prevalidated from response | Filter discovery by active category and approved provider; make detail eligibility explicit |
| Service `emergencyEnabled` defaults false and is absent from create/update DTOs | Emergency requests can be submitted for existing eligible records; new services cannot enable the feature through the API | Add validated emergency opt-in to service requests and responses |
| No provider-owned service listing; names cannot reliably prove ownership | Create services, keep just-created IDs in current component state; edit/deactivate using known IDs and server ownership checks | Add provider-owned listing, including inactive services and full editable fields |
| Provider response omits saved portfolio text and emergency setting; no public provider lookup | Display business name/description/status; explicit replacement form for portfolio/preferences; provider reviews by known ID | Return portfolio/preferences; add a safe provider public/read DTO and lookup |
| No update endpoint for business name/base description or portfolio image upload | Business profile can be created; only portfolio text/preferences can subsequently be changed | Add profile update and portfolio image APIs if these are required |
| No reschedule GET/list endpoints; request creation emits no notification | Homeowner sees returned request ID/status; provider enters supplied ID to decide. No persistent request history is simulated | Add participant-scoped request list/detail endpoints containing original/proposed appointment and status; notify participants after commit |
| Waitlist map omits `offerExpiresAt` | Show current statuses; no invented countdown; claim may fail if expired | Include expiry timestamp in waitlist responses |
| Time-off records are stored with available=false; availability reads select available=true | Publish/remove availability and block time off. Only the latest block submission result is visible for that visit | Add authorized time-off list/delete; ensure deletion removes the timeOff restriction, not merely available=false |
| No availability update | Remove and recreate eligible availability; server prevents conflicting removal | Add update only if required |
| No booking history endpoint/entity API; booking response omits reportDeadline and lateCancellation | Current state and response deadline shown; no fabricated audit/history or exact report countdown | Add participant-scoped history and relevant deadline/late-cancellation fields |
| No “my reviews” or review-by-booking endpoint | Show confirmed submission response and provider reviews by known profile ID; duplicate submissions are rejected by server | Add homeowner review listing or authorized booking review lookup |
| Admin cannot list/inspect provider applications | Approval form uses a provider profile ID supplied by applicant; never confuses user ID with profile ID | Add paginated provider application list/detail with safe user information |
| No provider rejection, user reactivation, separate user detail, global booking list, audits, platform settings, or admin report access | Only supported operations are offered; user details expand data already returned in list; bookings support authorized ID lookup | Add these capabilities only if product scope requires them, with explicit authorization |
| No backend CORS setup | Vite same-origin API/upload proxy in development and preview | Use a production reverse proxy; approve CORS changes only for a separate-origin deployment |
| Verification URL targets backend and password-reset mail contains raw token | Direct backend verification works; token entry forms support both workflows | Optional configurable frontend link templates, preserving verification security |

## What remains blocked

The requested automatic service-to-provider booking flow, persistent reschedule tracking, waitlist countdowns, a provider-owned service directory, visible blocked periods, and an admin application queue cannot be completed faithfully against the present response contracts. Their supported mutation endpoints have working request handlers in the frontend, but the full experiences need the changes above. No local storage or fake data is used to conceal these missing reads.

## Test environment concern

The existing backend is reachable at port 8070. The demo homeowner credentials in `DataSeed.java` returned HTTP 401 during verification. The demo profile may not be enabled, the running server may differ from source, or those records may not exist. The frontend does not activate profiles, alter account verification, inspect private database credentials, or reset existing account passwords to bypass this. Verified test accounts are needed for authenticated workflow testing.
