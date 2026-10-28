import { formatDateTime, formatAppointment } from "../utils/booking";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { bookingApi, get, post, allPages } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useResource } from "../hooks/useResource";
import {
  Resource,
  Empty,
  BookingCard,
  Field,
  ActionForm,
  ActionButton,
  Notice,
  Status,
  Pagination,
} from "../components/Common";
import { AdminOverview } from "./Admin";
import { ProviderOverview } from "./Provider";
import { Reschedules } from "./Reschedules";
import {
  activeBooking,
  homeownerBookingGroup,
  bookingGuidance,
  label,
  statuses,
  transitions,
  price,
  today,
  validateAppointment,
  appointmentTimestamp,
  canSubmitReport,
  providerBookingActions,
} from "../utils/booking";
export function Bookings() {
  const { user } = useAuth();
  return user.role === "HOMEOWNER" ? <HomeownerBookings /> : <ParticipantBookings />;
}
function ParticipantBookings() {
  const { user } = useAuth();
  const { revision } = useNotifications();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(() => statuses.includes(params.get("status")) ? params.get("status") : "");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const bookings = useResource(
    () =>
      bookingApi.list({
        status: status || undefined,
        page,
        size: 12,
        sort: "bookingDate,desc",
      }),
    [status, page, revision],
  );
  return (
    <>
      <div className="dashboard-heading"><div><p className="eyebrow">Booking management</p><h1>{user.role === "PROVIDER" ? "Assigned bookings" : "Bookings"}</h1>{user.role === "PROVIDER" && <p className="muted">Respond before the deadline, follow confirmed appointments and submit reports after visits.</p>}</div><button disabled={bookings.loading} onClick={bookings.reload}>Refresh bookings</button></div>
      {user.role === "ADMIN" && (
        <>
          <Notice>
            The list endpoint returns the current user's bookings. To inspect
            another booking, enter its ID.
          </Notice>
          <ActionForm
            submit="Open booking"
            success=""
            onSubmit={(values) => navigate(`/bookings/${values.bookingId}`)}
          >
            <Field
              name="bookingId"
              label="Booking ID"
              type="number"
              min="1"
              step="1"
              required
            />
          </ActionForm>
        </>
      )}
      <Field
        name="statusFilter"
        label="Filter by status"
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setPage(0);
        }}
        options={[
          { value: "", label: "All statuses" },
          ...statuses.map((value) => ({ value, label: label(value) })),
        ]}
      />
      <Resource resource={bookings}>
        {(result) => (
          <>
            {result.content.length ? (
              <div className="grid">
                {result.content.map((booking) => (
                  <BookingCard key={booking.id} booking={booking}>
                    {user.role === "PROVIDER" && booking.status === "PENDING" && <div className="inline-links">{providerBookingActions(booking).filter(next => ["CONFIRMED","REJECTED"].includes(next)).map(next => <ActionButton key={next} className={next === "CONFIRMED" ? "primary" : "danger"} action={() => {
                      if(!providerBookingActions(booking).includes(next)) throw new Error("This request can no longer be accepted. Refresh bookings.");
                      return bookingApi.status(booking.id,next);
                    }} onSuccess={bookings.reload} confirm={`${next === "CONFIRMED" ? "Accept" : "Reject"} booking #${booking.id} for ${formatAppointment(booking.bookingDate,booking.startTime,booking.endTime)}?`}>{next === "CONFIRMED" ? "Accept request" : "Reject request"}</ActionButton>)}</div>}
                  </BookingCard>
                ))}
              </div>
            ) : (
              <Empty>No bookings found.</Empty>
            )}
            <div className="pagination">
              <button disabled={!page} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {page + 1} of {Math.max(1, result.totalPages)}
              </span>
              <button
                disabled={page + 1 >= result.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </Resource>
    </>
  );
}
function HomeownerBookings() {
  const { revision } = useNotifications();
  const bookings = useResource(() => allPages("/booking", {sort:"bookingDate,desc"}), [revision]);
  const [group, setGroup] = useState("all");
  const [page, setPage] = useState(0);
  const groups = [["all","All bookings"],["pending","Pending"],["upcoming","Upcoming"],["ongoing","In progress / report due"],["completed","Completed"],["cancelled","Cancelled"],["other","Other / needs attention"]];
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Your service history</p><h1>My bookings</h1><p className="muted">Track requests, appointments and completed services. Times use Bahrain local time.</p></div><div className="inline-links"><button onClick={bookings.reload} disabled={bookings.loading}>Refresh bookings</button><Link className="button primary" to="/services">Find a service</Link></div></div>
    <Resource resource={bookings}>{rows => {
      const now = Date.now();
      const filtered = rows.filter(row => group === "all" || homeownerBookingGroup(row, now) === group).sort((a,b) => {
        const first = `${a.bookingDate}T${a.startTime}`;
        const second = `${b.bookingDate}T${b.startTime}`;
        return group === "upcoming" ? first.localeCompare(second) : second.localeCompare(first);
      });
      const totalPages = Math.ceil(filtered.length / 12);
      const current = Math.min(page, Math.max(0, totalPages - 1));
      return <>
        <div className="segmented-control booking-tabs" role="group" aria-label="Booking groups">{groups.map(([value,title]) => <button key={value} aria-pressed={group === value} onClick={() => {setGroup(value);setPage(0);}}>{title} <span className="tab-count">{value === "all" ? rows.length : rows.filter(row => homeownerBookingGroup(row, now) === value).length}</span></button>)}</div>
        <p className="field-hint">Pending includes all requests awaiting approval, including overdue requests. Upcoming contains only future confirmed appointments. Each card shows the status returned by HomeHub. “In progress” uses appointment time and does not confirm that work has started.</p>
        {filtered.length ? <div className="grid">{filtered.slice(current*12,current*12+12).map(booking => <BookingCard key={booking.id} booking={booking} />)}</div> : <Empty>No bookings in this group. <Link to="/services">Browse services</Link> or choose another group.</Empty>}
        <Pagination result={{totalPages}} page={current} setPage={setPage} />
      </>;
    }}</Resource>
  </>;
}

export function BookingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { revision } = useNotifications();
  const location = useLocation();
  const booking = useResource(() => bookingApi.detail(id), [id, revision]);
  const currentBooking =
    booking.data && String(booking.data.id) !== id
      ? { ...booking, data: null, loading: !booking.error }
      : booking;
  const myReviews = useResource(
    () => (user.role === "HOMEOWNER" ? allPages("/reviews/mine") : []),
    [id, user.role],
  );
  return (
    <>
      <Link className="back-link" to="/bookings">← All bookings</Link>
      <div className="dashboard-heading"><h1>Booking #{id}</h1><button onClick={booking.reload} disabled={booking.loading}>Refresh booking</button></div>
      {location.state?.created && (
        <Notice kind="success">Your booking request has been submitted. Check its status below; provider acceptance is still required.</Notice>
      )}
      <Resource resource={currentBooking} keepContent>
        {(item) => (
          <>
            <section className="card">
              <Status value={item.status} />
              <h2><Link to={`/services/${item.serviceId}`}>{item.serviceName}</Link></h2>
              {user.role === "HOMEOWNER" && <Notice>{bookingGuidance(item)}</Notice>}
              <dl>
                <dt>Provider</dt>
                <dd><Link to={`/providers/${item.providerId}`}>{item.providerName}</Link></dd>
                <dt>Appointment</dt>
                <dd>
                  {formatAppointment(item.bookingDate, item.startTime, item.endTime)}
                </dd>
                <dt>Home</dt>
                <dd><BookingHome homeId={item.homeId} /></dd>
                <dt>Booking type</dt>
                <dd>{label(item.bookingType) || "Not recorded"}{item.bookingType === "EMERGENCY" && " · final price includes the 20% emergency surcharge"}</dd>
                <dt>Final price</dt>
                <dd>{price(item.finalPrice)}</dd>
                {item.status === "PENDING" && item.responseDeadline && (
                  <>
                    <dt>Provider response deadline</dt>
                    <dd>{formatDateTime(item.responseDeadline)}</dd>
                  </>
                )}
                {item.note && (
                  <>
                    <dt>Notes</dt>
                    <dd>{item.note}</dd>
                  </>
                )}
                {item.reportDeadline && (
                  <>
                    <dt>Service report deadline</dt>
                    <dd>{formatDateTime(item.reportDeadline)}</dd>
                  </>
                )}
                {item.lateCancellation && (
                  <>
                    <dt>Cancellation</dt>
                    <dd>Recorded as a late cancellation</dd>
                  </>
                )}
                {item.createdAt && (
                  <>
                    <dt>Created</dt>
                    <dd>{formatDateTime(item.createdAt)}</dd>
                  </>
                )}
              </dl>
              {["HOMEOWNER", "ADMIN"].includes(user.role) &&
                activeBooking(item.status) && (
                  <div className="cancellation-panel"><p className="field-hint">You can cancel an active booking. Cancellations less than 24 hours before the appointment are recorded as late cancellations.</p><ActionButton
                    className="danger"
                    action={() => bookingApi.cancel(id)}
                    onSuccess={booking.reload}
                    confirm="Cancel this booking? Cancellations less than 24 hours before the appointment are recorded as late cancellations."
                  >
                    Cancel booking
                  </ActionButton></div>
                )}
              {["PROVIDER", "ADMIN"].includes(user.role) && (
                <div className="inline-links">
                  {(user.role === "PROVIDER" ? providerBookingActions(item) : (transitions[item.status] || []))
                    .filter(
                      (next) =>
                        (next !== "CONFIRMED" || providerBookingActions(item).includes("CONFIRMED")) &&
                        (next !== "COMPLETED" || user.role === "ADMIN") &&
                        (next !== "AWAITING_REPORT" ||
                          appointmentTimestamp(
                            `${item.bookingDate}T${item.endTime}`,
                          ) <= Date.now()),
                    )
                    .map((next) => (
                      <ActionButton
                        key={next}
                        action={() => {
                          if((user.role === "PROVIDER" || next === "CONFIRMED") && !providerBookingActions(item).includes(next)) throw new Error("This action is no longer available. Refresh the booking.");
                          return bookingApi.status(id,next);
                        }}
                        onSuccess={booking.reload}
                        confirm={
                          ["CANCELLED", "REJECTED"].includes(next)
                            ? `Mark this booking ${label(next)}?`
                            : undefined
                        }
                      >
                        {({CONFIRMED:"Accept request",REJECTED:"Reject request",CANCELLED:"Cancel booking",AWAITING_REPORT:"Mark awaiting report"})[next] || label(next)}
                      </ActionButton>
                    ))}
                </div>
              )}
            </section>
            {user.role === "HOMEOWNER" && ["PENDING", "CONFIRMED"].includes(item.status) && <HomeownerReschedule key={item.id} booking={item} onChange={booking.reload} revision={revision} />}
            {user.role !== "ADMIN" && (
              <Report key={item.id} booking={item} onChange={booking.reload} />
            )}
            {user.role === "HOMEOWNER" && item.status === "COMPLETED" && (
              <Resource resource={myReviews}>
                {(rows) =>
                  rows.some((row) => row.bookingId === item.id) ? (
                    <Notice>
                      You have reviewed this booking.{" "}
                      <Link to="/reviews">View my reviews</Link>
                    </Notice>
                  ) : (
                    <section className="card">
                      <h2>Review this service</h2>
                      <ActionForm
                        submit="Submit review" pending="Submitting review..."
                        onSubmit={(values) =>
                          post("/reviews", {
                            bookingId: +id,
                            rating: +values.rating,
                            comment: values.comment.trim() || null,
                          })
                        }
                        success={(result) =>
                          `Your review was submitted: ${result.rating}/5${result.comment ? ` — ${result.comment}` : ""}.`
                        }
                        onSuccess={myReviews.reload}
                      >
                        <Field
                          name="rating"
                          label="Rating"
                          required
                          options={[{value:"",label:"Select your rating"}, ...[[5,"Excellent"],[4,"Good"],[3,"Okay"],[2,"Poor"],[1,"Very poor"]].map(([value,title]) => ({value,label:`${value} / 5 · ${title}`}))]}
                        />
                        <Field
                          name="comment"
                          label="Comment (optional)"
                          type="textarea"
                          maxLength="3000"
                        />
                      </ActionForm>
                      <p className="muted">
                        One review is allowed per completed booking. Your rating and optional comment appear in provider reviews. Comments can contain up to 3,000 characters.
                      </p>
                    </section>
                  )
                }
              </Resource>
            )}
            {user.role === "PROVIDER" && <Assessments key={item.id} booking={item} />}
            {user.role !== "ADMIN" && <Reschedules bookingId={item.id} />}
            <BookingHistory
              bookingId={item.id}
              revision={`${revision}-${item.updatedAt}`}
            />
          </>
        )}
      </Resource>
    </>
  );
}
function BookingHome({ homeId }) {
  const { user } = useAuth();
  const home = useResource(async () => {
    if (user.role !== "HOMEOWNER") return null;
    try { return await get(`/homes/${homeId}`); }
    catch (failure) { if (failure.response?.status === 404) return null; throw failure; }
  }, [homeId, user.role]);
  if (user.role !== "HOMEOWNER") return <>#{homeId}</>;
  return <Resource resource={home}>{item => item ? <><strong>{item.name}</strong><br />{item.address}<br />{item.city}, Bahrain</> : <>Home #{homeId} · address no longer available</>}</Resource>;
}
function HomeownerReschedule({ booking, onChange, revision }) {
  const requests = useResource(() => get("/reschedules", {bookingId:booking.id,status:"PENDING",page:0,size:1}), [booking.id,revision,booking.updatedAt]);
  return <section className="card"><h2>Request a different appointment</h2>
    <p className="muted">The new appointment must be at least 24 hours away, including for emergency bookings. Your provider must approve the change; the original appointment remains until approval succeeds.</p>
    <Resource resource={requests} keepContent>{result => result.content.length ? <Notice>A reschedule request is already awaiting a decision. <Link to={`/reschedules/${result.content[0].id}`}>View the request</Link>.</Notice> : <ActionForm submit="Request reschedule" pending="Sending request..." submitDisabled={requests.loading || !!requests.error} onSubmit={values => {
      if (requests.loading || requests.error) throw new Error("Refresh reschedule requests before trying again.");
      validateAppointment(values.date,values.start);
      return bookingApi.reschedule(booking.id,values);
    }} onSuccess={() => {requests.reload();onChange();}} success={result => `Request #${result.id} submitted for ${formatAppointment(result.date,result.start)}. Awaiting provider decision.`}>
      <div className="form-columns"><Field name="date" label="Proposed date" type="date" min={today()} required /><Field name="start" label="Proposed time (Bahrain)" type="time" required /></div>
      <p className="field-hint">This is a requested time. HomeHub checks working hours, time off and appointment conflicts when the provider approves it.</p>
    </ActionForm>}</Resource>
  </section>;
}

function Report({ booking, onChange }) {
  const { user } = useAuth();
  const [submitted,setSubmitted] = useState(null);
  const report = useResource(async () => {
    try { return await get(`/reports/booking/${booking.id}`); }
    catch (failure) { if(failure.response?.status === 404) return null; throw failure; }
  }, [booking.id,booking.status]);
  return <section className="card"><div className="card-footer"><h2>Service report</h2><button disabled={report.loading} onClick={report.reload}>Refresh report</button></div>
    <p className="muted">The assigned provider submits a report after the appointment ends, then marks the booking completed. Reports are visible to the booking's homeowner and assigned provider.</p>
    {submitted?.bookingId === booking.id && <Notice kind="success">Your service report has been submitted.</Notice>}
    <Resource resource={report} keepContent>{stored => {
      const item = submitted?.bookingId === booking.id ? submitted : stored;
      return <>{item ? <div className="report-content"><h3>Work performed</h3><p className="preserve-lines">{item.workPerformed}</p><h3>Materials used</h3><p className="preserve-lines">{item.materialsUsed || "None specified."}</p><h3>Recommendations</h3><p className="preserve-lines">{item.recommendation || "None specified."}</p></div> : <>
        <Empty>No report has been submitted for this booking.</Empty>
        {user.role === "PROVIDER" && ["CONFIRMED","AWAITING_REPORT"].includes(booking.status) && (canSubmitReport(booking) ? <ActionForm submit="Submit service report" pending="Submitting report..." success="" submitDisabled={report.loading || !!report.error} onSubmit={values => {
          if(!canSubmitReport(booking)) throw new Error("A report can only be submitted after the appointment ends.");
          const body = Object.fromEntries(Object.entries(values).map(([key,value]) => [key,value.trim()]));
          if(!body.workDone) throw new Error("Describe the work performed before submitting.");
          return post(`/reports/booking/${booking.id}`,body);
        }} onSuccess={result => {setSubmitted(result);report.reload();}}>
          <Field name="workDone" label="Work performed" type="textarea" maxLength={3000} required hint="Describe the work completed. Up to 3,000 characters." />
          <Field name="materialsUsed" label="Materials used (optional)" type="textarea" maxLength={3000} />
          <Field name="recommendation" label="Recommendations (optional)" type="textarea" maxLength={3000} />
          <p className="field-hint">Check the details before submitting. Submitted reports cannot be edited or replaced here.</p>
        </ActionForm> : <Notice>You can submit a report after {formatAppointment(booking.bookingDate,booking.endTime)} (Bahrain). Refresh the booking when the appointment has ended.</Notice>)}
      </>}
      {user.role === "PROVIDER" && item && providerBookingActions(booking,true).includes("COMPLETED") && <ActionButton className="primary" disabled={report.loading || !!report.error} action={() => bookingApi.status(booking.id,"COMPLETED")} onSuccess={onChange} confirm="Mark this booking completed? The submitted service report will remain available to the homeowner.">Mark booking completed</ActionButton>}
      </>;
    }}</Resource>
    {booking.reportDeadline && <Notice>Report deadline: {formatDateTime(booking.reportDeadline)}. {appointmentTimestamp(booking.reportDeadline) <= Date.now() ? "This deadline has passed. Refresh the booking for its current status." : "Submit the report and complete the booking promptly after your visit."}</Notice>}
  </section>;
}
function Assessments({ booking }) {
  const [submitted,setSubmitted] = useState(null);
  const assessments = useResource(() => booking.status === "PENDING" ? get(`/assessments/booking/${booking.id}`) : [], [booking.id,booking.status]);
  return <section className="card private-assessments"><p className="eyebrow">Provider-only information</p><h2>Private homeowner assessments</h2><Notice>These notes are available only to authorized providers reviewing a pending booking. They are not visible to homeowners or in public reviews.</Notice>
    {booking.status === "PENDING" ? <Resource resource={assessments}>{rows => rows.length ? rows.map(row => <article className="assessment-entry" key={row.id}><strong>{row.rating != null ? `${row.rating} / 5` : "Comment only"}</strong><p className="preserve-lines">{row.comment || "No comment provided."}</p></article>) : <Empty>No previous homeowner assessments are available.</Empty>}</Resource>
    : booking.status === "COMPLETED" ? submitted?.bookingId === booking.id ? <Notice kind="success">Private assessment submitted: {submitted.rating != null ? `${submitted.rating} / 5` : "comment only"}. {submitted.comment}</Notice> : <>
      <p className="muted">Share an optional assessment of your experience after this completed visit. Provide a rating, a comment, or both. One assessment is allowed per booking.</p>
      <ActionForm submit="Submit private assessment" pending="Submitting assessment..." success="" onSubmit={values => {
        if(!values.rating && !values.comment.trim()) throw new Error("Choose a rating or enter a comment.");
        return post(`/assessments/booking/${booking.id}`,{rating:values.rating ? +values.rating : null,comment:values.comment.trim() || null});
      }} onSuccess={result => setSubmitted({...result,bookingId:booking.id})}>
        <Field name="rating" label="Rating (optional)" options={[{value:"",label:"No rating"},...[5,4,3,2,1].map(value => ({value,label:`${value} / 5`}))]} />
        <Field name="comment" label="Private comment (optional)" type="textarea" maxLength={3000} hint="Up to 3,000 characters. Keep notes relevant to the service experience." />
      </ActionForm><p className="field-hint">Previous assessments are not shown on completed bookings. If this booking was assessed previously, HomeHub will reject a duplicate submission.</p>
    </> : <p className="muted">Previous assessments can be viewed while reviewing a pending booking. New assessments can be submitted only after completion.</p>}
  </section>;
}
export function Dashboard() {
  const { user } = useAuth();
  return user.role === "ADMIN" ? <AdminOverview /> : user.role === "PROVIDER" ? <ProviderOverview /> : <MemberOverview />;
}
function MemberOverview() {
  const { user } = useAuth();
  const { items, revision, error: notificationError, loading: notificationsLoading, loaded: notificationsLoaded } = useNotifications();
  const bookings = useResource(() => allPages("/booking"), [revision]);
  const waitlist = useResource(
    () => (user.role === "HOMEOWNER" ? get("/waitlist") : []),
    [user.role, revision],
  );
  return (
    <>
      <section className="dashboard-heading">
        <div><p className="eyebrow">Your HomeHub workspace</p><h1>Welcome, {user.firstName}</h1><p className="muted">Everything you need to keep your day moving.</p></div>
        <div className="inline-links">
          <Link className="button primary" to={user.role === "PROVIDER" ? "/bookings" : "/services"}>{user.role === "PROVIDER" ? "Review booking requests" : "Find a service"}</Link>
          <Link className="button" to={user.role === "PROVIDER" ? "/provider/availability" : "/homes"}>{user.role === "PROVIDER" ? "Manage availability" : "Manage my homes"}</Link>
        </div>
      </section>
      <Resource resource={bookings}>
        {(rows) => {
          const upcoming = rows
            .filter((row) => activeBooking(row.status))
            .sort((a, b) =>
              `${a.bookingDate}T${a.startTime}`.localeCompare(
                `${b.bookingDate}T${b.startTime}`,
              ),
            );
          return (
            <>
              <div className="stats-grid" aria-label="Booking summary">
                <Link className="stat-card" to="/bookings"><span>Active bookings</span><strong>{upcoming.length}</strong><small>View appointments →</small></Link>
                <Link className="stat-card" to="/bookings"><span>{user.role === "PROVIDER" ? "Awaiting your response" : "Awaiting provider response"}</span><strong>{rows.filter(row => row.status === "PENDING").length}</strong><small>Review pending bookings →</small></Link>
                <Link className="stat-card" to="/bookings"><span>Completed bookings</span><strong>{rows.filter(row => row.status === "COMPLETED").length}</strong><small>View booking history →</small></Link>
              </div>
              <h2>
                {user.role === "PROVIDER"
                  ? "Requests and upcoming appointments"
                  : "Active bookings"}
              </h2>
              {upcoming.length ? (
                <div className="grid">
                  {upcoming.slice(0, 6).map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              ) : (
                <Empty>No active bookings.</Empty>
              )}
              <h2>Recent booking records</h2>
              <div className="grid">
                {rows
                  .slice()
                  .sort((a, b) => b.id - a.id)
                  .slice(0, 3)
                  .map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
              </div>
            </>
          );
        }}
      </Resource>
      {user.role === "HOMEOWNER" && (
        <>
          <h2>Waitlist offers</h2>
          <Resource resource={waitlist}>
            {(rows) => (
              <p>
                {rows.filter((row) => row.status === "OFFERED").length} offers
                currently reported by the server. Open Waitlist to claim an
                offer.
              </p>
            )}
          </Resource>
        </>
      )}
      <Reschedules embedded />
      <h2>Recent notifications</h2>
      <Notice kind="error">{notificationError}</Notice>
      {notificationsLoading && !notificationsLoaded && <p role="status">Loading notifications...</p>}
      {items.length ? (
        items.slice(0, 5).map((item) => <p key={item.id}>{item.message}</p>)
      ) : notificationsLoaded && !notificationError ? (
        <Empty>No notifications yet.</Empty>
      ) : null}
    </>
  );
}
function BookingHistory({ bookingId, revision }) {
  const [page, setPage] = useState(0);
  const history = useResource(
    () =>
      get(`/booking/${bookingId}/history`, {
        page,
        size: 10,
        sort: "createdAt,desc",
      }),
    [bookingId, page, revision],
  );
  return (
    <section className="card">
      <h2>Recorded booking history</h2>
      <Resource resource={history}>
        {(result) => (
          <>
            {result.content.length ? (
              <ol className="history">
                {result.content.map((event) => (
                  <li key={event.id}>
                    <strong>{event.action}</strong>
                    {event.status && (
                      <>
                        {" "}
                        → <Status value={event.status} />
                      </>
                    )}
                    <p>
                      {formatDateTime(event.recordedAt)} ·{" "}
                      {event.actorRole
                        ? `${label(event.actorRole)} #${event.actorId}`
                        : "No actor recorded"}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty>No recorded audit events for this booking.</Empty>
            )}
            <Pagination result={result} page={page} setPage={setPage} />
          </>
        )}
      </Resource>
      <p className="muted">
        Only events stored by the backend are shown. A complete status timeline
        may not have been recorded.
      </p>
    </section>
  );
}
