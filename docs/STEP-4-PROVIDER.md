# Step 4: Provider experience

Implemented in the existing HomeHub-Frontend repository. Step 5 is pending owner approval.

## Changed files

- src/pages/Provider.jsx: provider-specific dashboard with owned-booking counts, deadline/action cards, upcoming confirmed appointments, pending reschedule count and notification links; reusable onboarding/status guidance; profile creation/editing and saved portfolio preview; emergency-preference guidance; profile-not-found setup states; service catalogue with active/inactive filtering and pagination over existing owned-service reads; BHD price validation, editing and deactivation feedback; approval refresh and empty-category guidance; working-hours/time-off editor with date navigation, preserved period types and conflict/removal explanations. Existing homeowner-facing provider details retained.
- src/pages/Bookings.jsx: dashboard routes providers to the provider overview; booking filters accept supported status links; pending requests expose guarded accept/reject actions; expired response actions are withheld and rechecked before submission; detail actions use provider status rules; report submission validates trimmed work details, preserves submission feedback, formats multiline content, explains privacy/deadlines and requires a report before the separate completion action; private assessment forms/read states follow the existing pending/completed restrictions and suppress repeat submission within the current visit after success. Existing homeowner/admin flows retained.
- src/pages/Reschedules.jsx: persistent decision feedback, explicit 24-hour notice guidance, guarded approval, rejection where supported, and refresh states. The response does not supply a separate decision-deadline field; no deadline was invented.
- src/components/Common.jsx: booking cards accept existing action components as children.
- src/utils/booking.js: shared provider action eligibility, report readiness, reschedule approval and Bahrain period validation helpers.
- src/styles/global.css: responsive provider columns, onboarding steps, attention cards, working/time-off periods and private-assessment/report presentation.
- tests/booking.test.js: three non-destructive cases for provider response/report/terminal-state rules, reschedule notice boundaries and Bahrain schedule validation.
- docs/STEP-4-PROVIDER.md: this handoff.

## Verification

- Production Vite build passed (1,668 modules transformed).
- All 14 frontend unit/contract checks passed; contracts are checked against local source/schema snapshots, not a live server.
- Changed JSX parsed; checked imports and new rule/helper references resolved.
- Provider profile, service and availability initial states passed static rendering checks. Missing-profile onboarding rendered the creation link without a service-management link. These checks did not execute React effects or contact the backend.
- git diff --check passed.
- Browser appearance, real report/assessment persistence, notifications and authenticated workflows remain for manual testing.

## Preserved API limits

- Service creation requires an approved provider. Updates do not activate inactive services, and no reactivation endpoint exists. Deactivation is supported and no activation control was invented.
- Portfolio consists of text and emergency preferences. No portfolio image upload was added.
- Reports can be submitted for confirmed/awaiting-report bookings after the appointment ends. Completion is a separate action requiring an existing report. No report edit/delete behavior was invented.
- Assessment reads are limited to the assigned provider reviewing a pending booking; writes require a completed booking. No homeowner/admin access, persisted browser copies, or fabricated assessment history was added. A completed booking's previous assessment cannot be read through the existing API, so the server remains responsible for rejecting duplicates after revisiting the page.
- Dashboard report/completion follow-up counts use booking status and appointment end, not a claim that the report is missing; each booking loads its actual report.
- No automatic scheduling, offer processing or deadline transitions were enabled.

Prices use BHD with three decimal places and displayed appointments/deadlines use Bahrain local time. No backend/database edits, server starts, E2E tests, accounts, live API mutations, commits or pushes occurred. Existing uncommitted work was preserved.
