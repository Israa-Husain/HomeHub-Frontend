import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { bookingApi, get, post, allPages } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useResource } from '../hooks/useResource';
import { Resource, Empty, BookingCard, Field, ActionForm, ActionButton, Notice, Status } from '../components/Common';
import { activeBooking, label, statuses, transitions, price, today, validateAppointment } from '../utils/booking';
export function Bookings() {
  const { user } = useAuth();
  const { revision } = useNotifications();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const bookings = useResource(() => bookingApi.list({ status: status || undefined, page, size: 12, sort: 'bookingDate,desc' }), [status, page, revision]);
  return <><h1>{user.role === 'PROVIDER' ? 'Assigned bookings' : 'Bookings'}</h1>{user.role === 'ADMIN' && <><Notice>The list endpoint returns the current user's bookings. To inspect another booking, enter its ID.</Notice><ActionForm submit="Open booking" success="" onSubmit={values => navigate(`/bookings/${values.bookingId}`)}><Field name="bookingId" label="Booking ID" type="number" min="1" step="1" required/></ActionForm></>}<Field name="statusFilter" label="Filter by status" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }} options={[{ value: '', label: 'All statuses' }, ...statuses.map(value => ({ value, label: label(value) }))]}/><Resource resource={bookings}>{result => <>{result.content.length ? <div className="grid">{result.content.map(booking => <BookingCard key={booking.id} booking={booking}/>)}</div> : <Empty>No bookings found.</Empty>}<div className="pagination"><button disabled={!page} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {Math.max(1, result.totalPages)}</span><button disabled={page + 1 >= result.totalPages} onClick={() => setPage(page + 1)}>Next</button></div></>}</Resource></>;
}
export function BookingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { revision } = useNotifications();
  const location = useLocation();
  const booking = useResource(() => bookingApi.detail(id), [id, revision]);
  return <><h1>Booking #{id}</h1>{location.state?.created && <Notice kind="success">Your booking has been submitted.</Notice>}<Resource resource={booking}>{item => <><section className="card"><Status value={item.status}/><h2>{item.serviceName}</h2><dl><dt>Provider</dt><dd>{item.providerName}</dd><dt>Appointment</dt><dd>{item.bookingDate} · {item.startTime}–{item.endTime}</dd><dt>Home</dt><dd>#{item.homeId}</dd><dt>Booking type</dt><dd>{label(item.bookingType)}</dd><dt>Final price</dt><dd>{price(item.finalPrice)}</dd>{item.status === 'PENDING' && item.responseDeadline && <><dt>Provider response deadline</dt><dd>{item.responseDeadline.replace('T', ' ')}</dd></>}{item.note && <><dt>Notes</dt><dd>{item.note}</dd></>}</dl>{['HOMEOWNER', 'ADMIN'].includes(user.role) && activeBooking(item.status) && <ActionButton action={() => bookingApi.cancel(id)} onSuccess={booking.reload} confirm="Cancel this booking? Cancellations within 24 hours are recorded as late cancellations.">Cancel booking</ActionButton>}{['PROVIDER', 'ADMIN'].includes(user.role) && <div className="inline-links">{(transitions[item.status] || []).filter(next => next !== 'COMPLETED').map(next => <ActionButton key={next} action={() => bookingApi.status(id, next)} onSuccess={booking.reload} confirm={['CANCELLED', 'REJECTED'].includes(next) ? `Mark this booking ${label(next)}?` : undefined}>{label(next)}</ActionButton>)}</div>}</section>
    {user.role === 'HOMEOWNER' && ['PENDING', 'CONFIRMED'].includes(item.status) && <section className="card"><h2>Request a different appointment</h2><ActionForm onSubmit={values => { validateAppointment(values.date, values.start); return bookingApi.reschedule(id, values); }} submit="Request reschedule" success={result => `Request #${result.id}: ${label(result.status)} for ${result.date} at ${result.start}. Keep this ID; the API has no request history endpoint.`}><Field name="date" label="Proposed date" type="date" min={today()} required/><Field name="start" label="Proposed start time" type="time" required/></ActionForm><Notice>Provider approval is required. Pending requests and their later decisions cannot be retrieved through the current API.</Notice></section>}
    {user.role !== 'ADMIN' && <Report booking={item} onChange={booking.reload}/>}
    {user.role === 'HOMEOWNER' && item.status === 'COMPLETED' && <section className="card"><h2>Review this service</h2><ActionForm submit="Submit review" onSubmit={values => post('/reviews', { bookingId: +id, rating: +values.rating, comment: values.comment.trim() || null })} success={result => `Your review was submitted: ${result.rating}/5${result.comment ? ` — ${result.comment}` : ''}.`}><Field name="rating" label="Rating" type="number" min="1" max="5" step="1" required/><Field name="comment" label="Comment (optional)" type="textarea" maxLength="3000"/></ActionForm><p className="muted">One review is allowed per completed booking. The backend checks for duplicate submissions.</p></section>}
    {user.role === 'PROVIDER' && <Assessments booking={item}/>}</>}</Resource></>;
}
function Report({ booking, onChange }) {
  const { user } = useAuth();
  const report = useResource(async () => { try { return await get(`/reports/booking/${booking.id}`); } catch (error) { if (error.response?.status === 404) return null; throw error; } }, [booking.id, booking.status]);
  const ended = new Date(`${booking.bookingDate}T${booking.endTime}`) <= new Date();
  return <section className="card"><h2>Service report</h2><Resource resource={report}>{item => <>{item ? <><h3>Work performed</h3><p>{item.workPerformed}</p><h3>Materials used</h3><p>{item.materialsUsed || 'None specified.'}</p><h3>Recommendations</h3><p>{item.recommendation || 'None specified.'}</p></> : <><Empty>No report has been submitted.</Empty>{user.role === 'PROVIDER' && ['CONFIRMED', 'AWAITING_REPORT'].includes(booking.status) && (ended ? <ActionForm submit="Submit report" onSubmit={values => post(`/reports/booking/${booking.id}`, values)} onSuccess={report.reload}><Field name="workDone" label="Work performed" type="textarea" maxLength="3000" required/><Field name="materialsUsed" label="Materials used" type="textarea" maxLength="3000"/><Field name="recommendation" label="Recommendations" type="textarea" maxLength="3000"/></ActionForm> : <Notice>A report can be submitted after the appointment ends.</Notice>)}</>}{user.role === 'PROVIDER' && item && ['CONFIRMED', 'AWAITING_REPORT'].includes(booking.status) && <ActionButton action={() => bookingApi.status(booking.id, 'COMPLETED')} onSuccess={onChange}>Mark completed</ActionButton>}</>}</Resource><p className="muted">A report is required before completion. Report deadlines are enforced by the backend; they are not included in booking responses.</p></section>;
}
function Assessments({ booking }) {
  const assessments = useResource(() => booking.status === 'PENDING' ? get(`/assessments/booking/${booking.id}`) : [], [booking.id, booking.status]);
  return <section className="card"><h2>Private homeowner assessments</h2>{booking.status === 'PENDING' ? <Resource resource={assessments}>{rows => rows.length ? rows.map(row => <article key={row.id}><p>{row.rating ? `${row.rating}/5` : 'No rating'} · {row.comment}</p></article>) : <Empty>No previous assessments.</Empty>}</Resource> : booking.status === 'COMPLETED' ? <ActionForm submit="Submit private assessment" onSubmit={values => {
    if (!values.rating && !values.comment.trim()) throw new Error('Provide a rating or comment.');
    return post(`/assessments/booking/${booking.id}`, { rating: values.rating ? +values.rating : null, comment: values.comment.trim() || null });
  }}><Field name="rating" label="Rating (optional)" type="number" min="1" max="5" step="1"/><Field name="comment" label="Comment" type="textarea" maxLength="3000"/></ActionForm> : <p>Assessments can be viewed while reviewing a pending booking and submitted after completion.</p>}<p className="muted">Visible only to authorized providers. Assessments never appear in public reviews.</p></section>;
}
export function Dashboard() {
  const { user } = useAuth();
  const { items, revision } = useNotifications();
  const bookings = useResource(() => allPages('/booking'), [revision]);
  const waitlist = useResource(() => user.role === 'HOMEOWNER' ? get('/waitlist') : [], [user.role, revision]);
  return <><h1>Welcome, {user.firstName}</h1><p className="muted">Your HomeHub overview</p><Resource resource={bookings}>{rows => {
    const upcoming = rows.filter(row => activeBooking(row.status)).sort((a,b) => `${a.bookingDate}T${a.startTime}`.localeCompare(`${b.bookingDate}T${b.startTime}`));
    return <><h2>{user.role === 'PROVIDER' ? 'Requests and upcoming appointments' : 'Active bookings'}</h2>{upcoming.length ? <div className="grid">{upcoming.slice(0, 6).map(booking => <BookingCard key={booking.id} booking={booking}/>)}</div> : <Empty>No active bookings.</Empty>}<h2>Recent booking records</h2><div className="grid">{rows.slice().sort((a,b) => b.id - a.id).slice(0,3).map(booking => <BookingCard key={booking.id} booking={booking}/>)}</div></>;
  }}</Resource>{user.role === 'HOMEOWNER' && <><h2>Waitlist offers</h2><Resource resource={waitlist}>{rows => <p>{rows.filter(row => row.status === 'OFFERED').length} offers currently reported by the server. Open Waitlist to claim an offer.</p>}</Resource></>}<h2>Recent notifications</h2>{items.length ? items.slice(0, 5).map(item => <p key={item.id}>{item.message}</p>) : <Empty>No notifications yet.</Empty>}</>;
}
