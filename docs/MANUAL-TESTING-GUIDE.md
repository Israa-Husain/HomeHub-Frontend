# HomeHub frontend manual testing guide

Prepared for you to run through the website against the original `HomeHub` database. No workflows in this document were executed by the agent. A passing build/static check is not proof of a successful live workflow.

## 1. Before testing

1. Complete [Original environment startup and identity checks](ORIGINAL-ENVIRONMENT.md), including the startup seed/schema checks. Confirm the running original Java process connects to **HomeHub**, on backend port **8070**, before starting the frontend on **5173**.
2. Open `http://127.0.0.1:5173`. Use the same origin throughout. Keep browser DevTools Console/Network available to record failures. Do not record passwords, tokens or private assessment content in shared screenshots.
3. Use existing active, verified HOMEOWNER, PROVIDER and ADMIN accounts where available. A new provider can be registered manually if you choose. Admin self-registration is not supported. If you lack a role's existing credentials, mark that workflow blocked; do not reset unrelated accounts.
4. Use separate browser profiles/incognito windows for roles, or sign out before changing roles. The JWT is held in per-tab session storage; it is not a shared cross-role login.
5. Plan a small set of records you personally intend to create/update. Manual submission/approval/cancellation/deactivation changes the original database. Read-only browsing can be done first. Skip write cases if no suitable record is available. Do not use cleanup/reset/seed scripts.
6. Keep scheduling disabled. Time-based automatic status transitions/reminders/offer advancement are not acceptance criteria for this run. Do not change the clock, stored dates or backend scheduling to force a case.

Suggested order: basic authentication → existing admin/categories → provider onboarding/approval → provider service/availability → homeowner homes/discovery/bookings → provider decisions → reschedules/waitlists → reports/reviews/assessments → optional deactivation cases last.

## 2. Rules to keep visible while testing

- All displayed prices use BHD with three decimal places. Emergency bookings add **20%** to the standard price; final price comes from the backend.
- All appointments, deadlines and date minimums use **Bahrain local time (UTC+3)**. The backend JVM must also use Bahrain-equivalent business time.
- Normal bookings and waitlists require at least **24 hours** notice. Choose comfortably more than 24 hours for normal flow tests so time does not elapse across the boundary while you work.
- Emergency bookings require a future time, an eligible active service/category, an approved active provider, emergency opt-in at business and service level, and available working hours. Emergency does not guarantee acceptance.
- New bookings and successful waitlist claims create **PENDING** requests. Provider acceptance changes them to **CONFIRMED**.
- Provider response deadline is the earlier of 24 hours after creation and appointment start. Expired response actions should be absent or rejected after refresh. Without scheduling, the stored status may still say PENDING.
- Appointment duration must fit within the provider's working hours and the same date. Overlaps, time off and active offers can remove slots. Visible availability does not reserve an appointment.
- Reschedules are available for pending/confirmed bookings, with one pending request at a time. The proposed time must remain at least 24 hours away when requested and approved, including for emergency bookings.
- Homeowner cancellation is available for active bookings. Cancellations less than 24 hours before appointment start are recorded as late; no refund/fee policy is invented by the frontend.
- Reports require confirmed/awaiting-report status and an ended appointment; completion requires a saved report. Reviews require a completed booking, one per booking.
- Private assessment reads require the assigned provider reviewing a pending booking. Assessment submission requires the assigned provider and a completed booking, one per booking.

## 3. Authentication and account settings

| Role / prerequisite | Page | Action | Expected result / rule |
|---|---|---|---|
| Signed out | `/` then `/services` | Open home and browse services | Public branding renders; marketplace redirects to login because browsing requires JWT authentication. |
| Signed out, an email inbox you control; optional write case | `/register` | Choose Homeowner or Service provider; submit valid names, email, phone, password and confirmation | Password requires at least 8 characters and matching confirmation. New account success tells you to verify email. No ADMIN option. Identity/contact fields are limited to the mapped string lengths. |
| Signed out | `/register` | Submit missing fields, invalid email or mismatched passwords | Native/client validation prevents submission; clear guidance appears. No account should be created for a client-validation failure. |
| Newly registered account, welcome email received | Email link or `/verify` | Open the verification link, or paste its token and press Verify email | The backend email link targets port 8070 and can return JSON directly; return to frontend login afterward. `/verify` shows success for a valid unused token. Verification expires after 24 hours. Do not consume the same token in both places and expect two successes. |
| Signed out | `/verify` | Use a known expired/used token only if already available | Show returned error; no fabricated resend action. Missing/expired verification email is a blocker for that account because there is no resend endpoint. |
| Any active verified role | `/login` | Sign in with that role's existing credentials | Its workspace and role navigation appear. If you came from a protected page, return there; wrong-role destinations show Access restricted. Incorrect/inactive/unverified login gets the backend's error. |
| Signed in | Header Sign out | Sign out, then open a protected URL | JWT and local user/notification state clear; protected pages require login. This is local sign-out, not server-side token revocation. |
| Signed in | Current workspace | Refresh tab | Valid session restores. A connection failure should offer retry; expired JWT should return to login with a session-ended notice. No role's protected data should render before authorization. |
| Signed out, email you control; optional write case | `/forgot-password` then `/reset-password` | Request reset instructions, copy token from email, enter new password and confirmation | Request response is deliberately generic and does not prove delivery or account existence. Reset token expires after 30 minutes; valid reset succeeds, then login with the new password. |
| Signed in as any role; optional write case | `/account` | Edit names/phone, save, refresh | Explicit success; saved profile is shown after reload. Email/role are informational, not editable unsupported fields. |
| Signed in, optional write case | `/account` | Upload JPG/PNG/WEBP up to 5,000,000 bytes | Accepted image appears after profile refresh and loads through `/uploads`. Invalid size/type produces feedback. This upload is an account picture, not provider portfolio images. |
| Signed in, knows current password; optional write case | `/account` | Enter current/new/confirmed password | Matching new password with at least 8 characters is submitted; success clears password inputs. Wrong current password shows a backend error. Record the chosen new password privately. |

## 4. Homeowner workflows

| Role / prerequisite | Page | Action | Expected result / rule |
|---|---|---|---|
| HOMEOWNER | `/dashboard` | Review counts and shortcuts | Counts come from owned bookings. History groups organize records without inventing backend statuses. Loading/errors are distinct from empty results. |
| HOMEOWNER | `/services` | Search name, choose category, set min/max BHD prices, sort and paginate | Results match submitted filters; counts and BHD prices appear. Min greater than max is rejected. Clear filters resets the form/results. |
| HOMEOWNER | `/services/:id`, then provider link | Inspect service/category/provider, duration, standard price, emergency availability, portfolio and reviews | Accurate existing fields; unsupported/inactive records show returned errors/unavailability. No fake provider imagery or ratings. |
| HOMEOWNER, optional write case | Service detail → `/favorites` | Save, view, open booking choice, then optionally remove favorite after confirmation | Saved service appears with provider/BHD information. Removing affects only the favorite. Failed metadata loads show an error rather than claiming the service was deleted. |
| HOMEOWNER, optional write case | `/homes` | Add a named Bahrain home with city and complete building/road/block/address | Required/blank fields rejected; new home appears after saving and is available in booking choices. |
| HOMEOWNER, optional write case | `/homes` | Edit a chosen home | Saved values persist; cancel editing does not submit. From a service's home-management link, Use this home returns to that service with it selected. |
| HOMEOWNER, chosen address no longer needed; optional write case | `/homes` | Remove home and confirm | Address is deactivated for new bookings, not permanently deleted. Existing bookings retain their home ID; the current API cannot retrieve an inactive address for historical display. Do not remove a home still needed for the remaining tests. |
| HOMEOWNER with active home; provider has active eligible service and working hours >24h away; optional write case | `/services/:id` | Choose home, Normal, date and returned available time; inspect summary; submit once | Address, duration, standard BHD price and estimated total are clear. A real PENDING booking detail appears with returned final price/response deadline. It is not yet confirmed. Duplicate/changed slot conflicts should show backend errors without a fake success. |
| HOMEOWNER; business and service emergency opt-in enabled and future working slot exists; optional write case | `/services/:id` | Choose Emergency and a future time; inspect surcharge; submit | Breakdown shows standard price +20% = estimate, all with three decimals. Returned final price/status is authoritative. No option appears for an ineligible service. |
| HOMEOWNER | `/bookings` | Switch All, Upcoming, In progress/report due, Completed, Cancelled, Other | Counts and local pagination cover owned history. Upcoming sorts nearest first; actual statuses/deadlines remain visible. In progress is a time/status grouping, not proof work started. |
| HOMEOWNER | `/bookings/:id` | Inspect details and recorded history | Service/provider links, appointment, price, notes, home where available and recorded audit events appear. No invented original reschedule snapshot or exact automatic expiration timestamp. |
| HOMEOWNER with chosen active booking; optional write case | `/bookings/:id` | Cancel and confirm | Cancellation succeeds and refreshed status is CANCELLED; late flag appears if backend records it. Completed/rejected/expired bookings should not offer this homeowner cancellation action. |
| HOMEOWNER with pending/confirmed booking, no pending reschedule; optional write case | `/bookings/:id` | Submit proposed date/time >24h away | Request is pending; original booking stays unchanged. Pending request blocks another form. Check `/reschedules` and request detail. Availability is revalidated at approval. |
| HOMEOWNER after provider decides | `/reschedules/:id`, `/bookings/:id` | Refresh and inspect decision/current appointment | Approved request updates the booking; rejected request leaves the booking appointment unchanged by that decision. Current appointment fields are not an immutable pre-change snapshot. |
| HOMEOWNER with active home and an occupied working slot >24h away; optional write case | Service detail → waitlist disclosure | Enter that date/time and join | WAITING entry appears under `/waitlist`. Available direct-booking times should be booked normally; a time outside working hours is rejected. There is no occupied-slot discovery picker. |
| HOMEOWNER with a valid OFFERED entry; optional write case | `/waitlist` | Inspect returned expiry/countdown; claim before expiry | Countdown uses Bahrain timestamp. Expired/unreadable offers cannot be claimed from the UI. Successful claim creates a PENDING normal booking and offers its link. Server rejection of stale offers appears as an error. |
| HOMEOWNER with WAITING/OFFERED entry; optional write case | `/waitlist` | Leave and confirm | Entry updates after refresh. No claim/leave is offered for terminal states. |
| HOMEOWNER with completed owned booking, no review; optional write case | `/bookings/:id` | Choose 1–5 rating, optional comment up to 3,000 chars; submit | Saved review feedback; another review form is suppressed after reload. `/reviews` lists prior reviews with service/booking/provider links and Bahrain timestamps. No edit/delete feature is implied. |
| HOMEOWNER | `/notifications` | Filter unread, refresh and mark a chosen item read | Existing unread count updates after reload. SSE status is shown; reconnecting does not masquerade as an empty inbox. No notification timestamps are fabricated. |

### Conditional waitlist exercise

If you choose to exercise offer generation, use only a booking/time you intentionally selected for this manual test. Join its occupied working interval, then cancel that booking or use a supported provider rejection/cancellation action in the appropriate account. Existing action-triggered backend logic may offer the freed slot. Offers are currently 15 minutes and a normal booking still needs 24 hours' notice at claim time. If there is no suitable occupied slot or no offer is produced, mark the offer/claim case blocked. Do not call scheduler methods, alter dates, or edit waiting/booking records directly. Expiration countdown can be inspected, but automatic expired-offer cleanup/advancement is not expected with scheduling disabled.

## 5. Provider workflows

| Role / prerequisite | Page | Action | Expected result / rule |
|---|---|---|---|
| PROVIDER | `/dashboard` | Review setup status, pending requests, upcoming appointments, report/completion follow-up and notifications | Counts use owned API data. Follow-up count means an ended confirmed/awaiting-report booking, not proof its report is missing; open the booking to inspect the report. |
| PROVIDER with no profile; optional write case | `/provider/profile` | Create business name/description | Profile becomes PENDING for admin review. Missing-profile service/availability/review screens guide back to setup rather than crash. |
| PROVIDER pending approval | `/provider/profile` | Add portfolio text and emergency preference; inspect saved preview | Existing fields persist after save. Editing does not self-approve. Portfolio text is limited to 3,000 characters; no portfolio image upload. |
| PROVIDER, after admin approval | `/provider/services` | Refresh approval status | Service creation becomes available. Pending/suspended status does not acquire approval from editing. |
| Approved PROVIDER, active category exists; optional write case | `/provider/services` | Add positive three-decimal BHD price, whole-minute duration, category, description and emergency setting | Active service appears in owned catalogue. Choose a duration that fits one date/working period; durations of a full day or longer have no supported booking slots. |
| PROVIDER with owned service; optional write case | `/provider/services` | Filter Active/Inactive, view and edit service | Existing data prefills; saves preserve status. Emergency eligibility requires both business/service opt-in plus normal eligibility. |
| PROVIDER with service no longer needed for tests; optional write case | `/provider/services` | Deactivate and confirm | Service becomes INACTIVE and no longer accepts new bookings. Editing does not reactivate it; no activation control exists. Do this after booking cases needing the service. |
| PROVIDER with profile; optional write case | `/provider/availability` | Choose date, add Working hours with valid start/end | Period appears in Bahrain time. Past dates, equal/reversed times rejected. Provider approval is not falsely required for creating schedule periods; service creation still requires approval. |
| PROVIDER; optional write case | `/provider/availability` | Add Time off, edit or remove a period | Blocks appear distinctly; editing preserves type. Existing-booking overlap errors remain visible. Removing time off restores only already-published working hours; it does not create hours. |
| Assigned PROVIDER with pending booking before response deadline; optional write case | `/bookings?status=PENDING` or booking detail | Inspect request/private assessments; accept or reject with confirmation | Accepted → CONFIRMED; rejected → REJECTED. Missed response deadline withholds actions or gets a backend rejection. Refresh for actual status; no fake automatic expiration. |
| Assigned PROVIDER, confirmed visit has ended; optional write case | `/bookings/:id` | Use Mark awaiting report if offered | Status changes to AWAITING_REPORT; returned report deadline is displayed. This is an explicit supported transition, not a claim that a timer ran. |
| Assigned PROVIDER with pending reschedule; optional write case | `/provider/reschedules`, `/reschedules/:id` | Inspect current/proposed appointment and choose approve/reject | Confirm decision. Approval requires proposed time still ≥24h away and backend conflict validation; rejection leaves appointment unchanged by that decision. UI hides approval when the notice period no longer qualifies. No separate deadline field is invented. |
| Assigned PROVIDER with ended confirmed/awaiting-report booking, no report; optional write case | `/bookings/:id` | Describe work, optional materials/recommendations; submit report | Required trimmed work details and max 3,000 chars per report field. Saved report is readable by assigned provider/homeowner. No report edit/replace feature. |
| Assigned PROVIDER with saved report; optional write case | Same booking detail | Mark booking completed and confirm | COMPLETED only after report exists; homeowner can review. Do not change dates/statuses directly to reach this step. If no ended suitable booking exists, wait naturally or mark blocked. |
| Assigned PROVIDER with completed booking, not assessed; optional write case | Same booking detail | Submit rating and/or private comment | At least one required, optional rating 1–5, comment ≤3,000 chars. Successful current-visit submission replaces the form. Earlier saved assessments cannot be read on a completed booking through this API; a repeat after revisiting is rejected server-side. |
| Assigned PROVIDER reviewing pending booking | Pending booking detail | View previous homeowner assessments | Provider-only notes appear if any. They must not appear to the homeowner/admin, in public reviews, or unrelated bookings. No private data is copied to browser persistence. |
| PROVIDER | `/notifications` | Refresh, inspect live connection, mark chosen items read | Persisted events and count update. Scheduled reminders remain blocked while scheduling is disabled. |

## 6. Admin workflows

| Role / prerequisite | Page | Action | Expected result / rule |
|---|---|---|---|
| Existing active verified ADMIN | `/dashboard` | Review summary and navigation | Registered-user, provider-profile, pending-application and active-category counts come from actual page metadata. No invented revenue/global-booking metrics. |
| ADMIN | `/admin/providers` | Change Pending/Approved/Suspended/All; paginate; review application | Oldest-first list, real statuses, business/portfolio/contact/account verification and Bahrain timestamps. Selected detail loads independently with retry/close controls. |
| ADMIN with chosen pending application; optional write case | Application detail | Review applicant status/email and confirm Approve provider | Actual provider profile ID is approved; success identifies it and reloads list. Approval does not activate a user or verify email. No rejection/suspension/reactivation action is fabricated. |
| ADMIN | `/admin/users` | Paginate; expand user details | Names/email/roles/status and verification/contact/Bahrain timestamps shown. Current admin account is labelled and has no self-deactivation control. |
| ADMIN with a deliberately selected expendable active user; optional write case | `/admin/users` | Confirm deactivation by name/email/ID | Account becomes INACTIVE; loses access on subsequent authenticated calls/login; records retained. No reactivation action exists. Skip if no suitable account is available; never deactivate the only usable admin/provider/homeowner needed for remaining cases. |
| ADMIN; optional write case | `/admin/categories` | Add a named category and optional description | Trimmed name required, success appears, active category can be chosen for provider services. Backend uniqueness errors appear rather than duplicate fake rows. |
| ADMIN; optional write case | `/admin/categories` | View/edit a chosen category and save | Prefilled fields update and persist after refresh. Cancel editing does not submit. |
| ADMIN with category no longer needed; optional write case | `/admin/categories` | Deactivate and confirm | Category disappears from active-only directory; linked service discovery/new eligibility stops. Records retained, no inactive-directory/reactivation feature. Do this after related service/booking cases. |
| ADMIN with known existing booking ID | `/bookings` → ID lookup | Open existing authorized booking/history | Current-user list is not a global admin directory. Private reports and homeowner assessments are not exposed via an invented admin override. |

## 7. Navigation, validation and responsive review

Repeat with desktop (~1440px), tablet (~768px) and mobile (~390px), manually resizing your browser:

1. Open each role's dashboard and every sidebar entry. On mobile, open Menu, choose an entry and confirm it closes. Check back links, refresh controls, browser back/forward and hard refresh of a nested URL.
2. Tab through navigation, fields, menus and buttons. Confirm visible focus, matching labels/help, readable errors, disabled pending buttons and focused success/error feedback. Native pickers may use your browser's date-input presentation; appointment summaries still use Bahrain time.
3. Review tables within their scroll containers, stacked editors, long descriptions and cards. No page-wide horizontal overflow should be needed at supported sizes.
4. Try empty searches and existing empty lists; distinguish no results from a failed request. Do not manufacture records solely to make a screenshot look full.
5. When you choose to simulate a browser network outage, turn it off afterward, retry and verify saved form input is retained where intended. Do not submit write actions while you cannot tell whether the first request succeeded; refresh the actual record before retrying.
6. Try another role's protected page URL. It should show Access restricted (or login when signed out) and must not reveal restricted data. Server authorization remains authoritative.
7. Compare BHD values and Bahrain appointment/deadline displays across roles. If your browser timezone differs, summaries/countdowns should still represent Bahrain. Do not change backend/database clocks.

## 8. Record results and stop

For each case record: date/time, role, page, existing/intentional record ID, action, expected result, actual result and Pass/Fail/Blocked. Record browser errors or HTTP status and a redacted message if useful. Never include credentials/JWTs in the report. Frontend success messages do not prove email delivery or scheduled task execution.

Mark unavailable prerequisites and unsupported API capabilities **Blocked/Not supported**, not passed. Preserve the original data; do not reset, delete test history or run automated cleanup. Stop both original run configurations yourself when finished. Share failures for review without enabling scheduling or changing backend functionality as a workaround.
