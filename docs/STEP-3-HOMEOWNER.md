# Step 3: Homeowner experience

Implemented in the existing HomeHub-Frontend repository. Step 4 is pending owner approval.

## Changed files

- `src/pages/Services.jsx`: refreshed discovery and search, category loading/error/retry, BHD range inputs, result counts and clear filters; organized service/provider information; active-home selection and address preview; normal/emergency guidance and 20% price breakdown; request summary; rejects stale/unavailable slot choices; direct return path from home management; duplicate joined-waitlist submission disabled for the same local selection.
- `src/pages/Homes.jsx`: saved-address list and responsive editor, trimmed required fields, save/remove feedback, editor focus, optional return-to-service and use-this-home links. Removal uses the existing soft-deactivation endpoint and does not claim permanent deletion or account-wide effects.
- `src/pages/Saved.jsx`: improved favorite cards/booking links/removal confirmation and metadata-error handling; waitlist refresh and service/home labels from existing reads; expiry-aware claim controls, immediate expiry recheck and accurate pending-booking confirmation; review links and rating presentation. Notification interfaces from Step 2 retained.
- `src/pages/Bookings.jsx`: homeowner-specific history groups/counts and local pagination over all existing owned-booking pages; actual backend statuses retained; details include service/provider links, owned-home address where available, emergency pricing explanation and response/report deadlines; cancellation guidance; pending-reschedule check prevents offering duplicate requests; existing review form now has labelled rating choices and clearer guidance. Existing provider/admin workflows retained.
- `src/pages/Reschedules.jsx`: clearer request/decision guidance, Bahrain appointment formatting retained, and cancelled-request display/filter matching the existing enum. No unsupported cancellation action added.
- `src/pages/Provider.jsx`: improved provider detail/portfolio presentation and emergency/service guidance. Provider management pages are reserved for Step 4.
- `src/components/Common.jsx`: shared submission-disabled option, disabled action option, local validation-error messages, provider/emergency information on service cards, and booking guidance/details links.
- `src/utils/booking.js`: presentation-only homeowner history grouping and status guidance; existing Bahrain and BHD helpers retained.
- `src/styles/global.css`: responsive homeowner address management, booking summaries, service facts, history groups and review/action styles.
- `tests/booking.test.js`: two non-destructive unit cases covering booking grouping/deadline boundaries and BHD/Bahrain rollover formatting.
- `docs/STEP-3-HOMEOWNER.md`: this handoff.

## Verification

- Final production Vite build passed (1,668 modules).
- All 11 frontend unit/contract checks passed. Contract checks use local source/schema snapshots, not live HTTP.
- Changed JSX parsed; inspected imports and new formatting/state references resolved.
- Static rendering checks passed for discovery controls, home-management fields and disabled form submission. These checks did not execute React effects or contact APIs.
- `git diff --check` passed.
- No browser/E2E scenarios ran. Browser appearance, real API responses and persisted workflows remain for the owner's manual testing.

## Existing rules and API limits

- Emergency booking: 20% surcharge, future appointment, eligible service/provider; the server revalidates availability and final price.
- Normal bookings, reschedules and waitlists: at least 24 hours' notice. Provider approval is required for bookings and reschedule requests.
- A waitlist claim creates a pending normal booking request, not an automatically confirmed booking. Countdown uses returned expiry in Bahrain time. No invented automatic offer or expiration process was added.
- History groups are frontend organization, not new statuses or proof that work has started.
- Removing a home deactivates it. The existing API cannot return its address afterward; booking details retain the actual home ID rather than fabricate a historical address.
- There is no occupied-slot discovery API for a waitlist picker. Requested waitlist times are entered explicitly and validated by the backend against working hours, bookings and offers.
- Reviews remain one per completed booking. No review edit/delete capability was invented.

No backend or PostgreSQL changes, backend starts, account creation, live API mutations, commits or pushes occurred. Existing uncommitted work was preserved.
