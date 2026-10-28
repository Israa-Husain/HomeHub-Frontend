import { formatDateTime, formatAppointment } from "../utils/booking";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { get, post, remove } from "../api";
import { useResource } from "../hooks/useResource";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api/client";
import { remainingOfferSeconds, price } from "../utils/booking";
import {
  Resource,
  Loading,
  Empty,
  ServiceCard,
  ActionButton,
  Status,
  Notice,
  Pagination,
} from "../components/Common";
export function Favorites() {
  const favorites = useResource(async () => {
    const saved = await get("/favorites");
    return Promise.all(
      saved.map(async (favorite) => {
        try {
          return {
            ...favorite,
            service: await get(`/services/${favorite.serviceId}`),
          };
        } catch (failure) {
          return {...favorite, unavailable: failure.response?.status === 404, error: errorMessage(failure)};
        }
      }),
    );
  });
  return (
    <>
      <div className="dashboard-heading"><div><p className="eyebrow">Your shortlist</p><h1>Favorite services</h1><p className="muted">Compare saved services and open a service to choose your home and appointment.</p></div><Link className="button primary" to="/services">Explore services</Link></div>
      <button onClick={favorites.reload} disabled={favorites.loading}>Refresh favorites</button>
      <Resource resource={favorites}>
        {(rows) =>
          rows.length ? (
            <div className="grid">
              {rows.map((item) => (
                <div key={item.id}>
                  {item.service ? (
                    <ServiceCard service={item.service}><Link className="text-action" to={`/services/${item.service.id}`}>Choose an appointment</Link></ServiceCard>
                  ) : (
                    <article className="card">
                      <h2>Service #{item.serviceId}</h2>
                      {item.unavailable ? <p>This service is no longer available.</p> : <Notice kind="error">{item.error}</Notice>}
                      <button onClick={favorites.reload}>Retry saved services</button>
                    </article>
                  )}
                  <ActionButton
                    action={() => remove(`/favorites/${item.id}`)}
                    onSuccess={favorites.reload}
                    confirm="Remove this service from your favorites?"
                  >
                    Remove favorite
                  </ActionButton>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              No saved services. <Link to="/services">Browse services</Link> to
              save one.
            </Empty>
          )
        }
      </Resource>
    </>
  );
}
export function Waitlist() {
  const { revision } = useNotifications();
  const [claimed, setClaimed] = useState(null);
  const entries = useResource(() => get("/waitlist"), [revision]);
  return (
    <>
      <div className="dashboard-heading"><div><p className="eyebrow">Another chance at your preferred time</p><h1>My waitlist</h1><p className="muted">Join from a service page. Watch for an offer, then claim it before it expires.</p></div><button onClick={entries.reload} disabled={entries.loading}>Refresh waitlist</button></div>
      <Notice>
        An offer can expire before you claim it. A slot is booked only after the
        server confirms your claim. Expiration timestamps use Bahrain time
        (UTC+3).
      </Notice>
      {claimed && (
        <Notice kind="success">
          Offer claimed. Your booking request is awaiting provider acceptance.{" "}
          <Link to={`/bookings/${claimed.id}`}>Open booking #{claimed.id}</Link>
          .
        </Notice>
      )}
      <Resource resource={entries}>
        {(rows) =>
          rows.length ? (
            <div className="grid">
              {rows.map((item) => (
                <article className="card" key={item.id}>
                  <Status value={item.status} />
                  <WaitlistContext serviceId={item.serviceId} homeId={item.homeId} />
                  <p>{formatAppointment(item.date, item.start)}</p>
                  {item.status === "OFFERED" && <OfferExpiration value={item.offerExpiresAt}>
                    {seconds => <ActionButton disabled={seconds === null || seconds === 0} action={() => {
                      if (!remainingOfferSeconds(item.offerExpiresAt)) throw new Error("This offer has expired. Refresh your waitlist.");
                      return post(`/waitlist/${item.id}/claim`);
                    }} onSuccess={booking => {setClaimed(booking);entries.reload();}} confirm="Claim this offer and submit a normal booking request? Provider acceptance is still required.">Claim offer</ActionButton>}
                  </OfferExpiration>}
                  {["WAITING", "OFFERED"].includes(item.status) && (
                    <ActionButton
                      action={() => remove(`/waitlist/${item.id}`)}
                      onSuccess={entries.reload}
                      confirm="Leave this waitlist?"
                    >
                      Leave waitlist
                    </ActionButton>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty>No waitlist entries. <Link to="/services">Explore services</Link> to find an appointment.</Empty>
          )
        }
      </Resource>
    </>
  );
}
function WaitlistContext({ serviceId, homeId }) {
  const details = useResource(async () => {
    const optional = async path => {
      try { return await get(path); }
      catch (failure) { if (failure.response?.status === 404) return null; throw failure; }
    };
    const [service,home] = await Promise.all([optional(`/services/${serviceId}`),optional(`/homes/${homeId}`)]);
    return {service,home};
  }, [serviceId,homeId]);
  // Identifiers remain visible when additional metadata cannot be retrieved.
  if (details.error) return <><h2><Link to={`/services/${serviceId}`}>Service #{serviceId}</Link></h2><p>Home #{homeId}</p><Notice kind="error">{details.error}</Notice><button onClick={details.reload}>Retry service and home details</button></>;
  return <Resource resource={details}>{({service,home}) => <><h2><Link to={`/services/${serviceId}`}>{service?.name || `Service #${serviceId}`}</Link></h2>{service && <p className="muted">{service.providerName} · {price(service.price)}</p>}<p>{home ? `${home.name} · ${home.city}` : `Home #${homeId} · address no longer available`}</p></>}</Resource>;
}

export function Notifications() {
  const { items, count, error, connection, refresh, markRead, loading, loaded } = useNotifications();
  const [filter, setFilter] = useState("all");
  const visible = filter === "unread" ? items.filter(item => !item.read) : items;
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Stay up to date</p><h1>Notifications</h1><p className="muted">Booking updates and messages from HomeHub, in one place.</p></div>
      <button onClick={refresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh notifications"}</button></div>
    <div className="notification-toolbar"><div className="segmented-control" role="group" aria-label="Filter notifications">
      <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All updates</button>
      <button aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>Unread ({count})</button>
    </div><span className="connection-status" role="status">{connection === "Live" ? "Live updates connected" : connection === "Disconnected" ? "Updates disconnected" : "Connecting to live updates..."}</span></div>
    {connection === "Reconnecting" && <Notice>Live updates are reconnecting. You can refresh to check for new notifications.</Notice>}
    <Notice kind="error">{error}</Notice>
    {loading && <Loading label={loaded ? "Refreshing notifications..." : "Loading notifications..."} compact={loaded} />}
    {loaded && (visible.length ? <div className="notification-list">{visible.map(item => <article className={`card notification ${item.read ? "" : "unread"}`} key={item.id}>
      <div className="notification-content"><span className={`badge ${item.read ? "" : "confirmed"}`}>{item.read ? "Read" : "Unread"}</span><p>{item.message}</p></div>
      {!item.read && <ActionButton action={() => markRead(item.id)}>Mark as read</ActionButton>}
    </article>)}</div> : <Empty>{filter === "unread" ? "You're all caught up. There are no unread notifications." : "No notifications yet. Your HomeHub updates will appear here."}</Empty>)}
  </>;
}
export function Reviews() {
  const { user } = useAuth();
  const profile = useResource(
    async () => {
      if (user.role !== "PROVIDER") return null;
      try { return await get("/providers/profile"); }
      catch (failure) { if (failure.response?.status === 404) return null; throw failure; }
    },
    [user.role],
  );
  return (
    <>
      <h1>{user.role === "HOMEOWNER" ? "My reviews" : "Provider reviews"}</h1>
      {user.role === "HOMEOWNER" ? (
        <MyReviews />
      ) : user.role === "PROVIDER" ? (
        <Resource resource={profile}>
          {(item) => item ? <ProviderReviews providerId={item.id} /> : <Empty>Create your <Link to="/provider/profile">business profile</Link> before viewing provider reviews.</Empty>}
        </Resource>
      ) : (
        <p>
          Open a <Link to="/services">service</Link> or provider profile to view
          its public reviews.
        </p>
      )}
    </>
  );
}
function MyReviews() {
  const [page, setPage] = useState(0);
  const reviews = useResource(
    () => get("/reviews/mine", { page, size: 12, sort: "createdAt,desc" }),
    [page],
  );
  return (
    <Resource resource={reviews}>
      {(result) => (
        <>
          {result.content.length ? (
            result.content.map((row) => (
              <article className="card" key={row.id}>
                <h2><Link to={`/services/${row.serviceId}`}>{row.serviceName}</Link></h2>
                <p><Link to={`/providers/${row.providerId}`}>View provider</Link></p>
                <strong className="review-rating">{row.rating} / 5 <span aria-hidden="true">★</span></strong>
                <p>{row.comment || "No comment provided."}</p>
                <Link to={`/bookings/${row.bookingId}`}>
                  Booking #{row.bookingId}
                </Link>
                <p className="muted">{formatDateTime(row.createdAt)}</p>
              </article>
            ))
          ) : (
            <Empty>
              No submitted reviews. Open a <Link to="/bookings">completed booking</Link> to share your experience.
            </Empty>
          )}
          <Pagination result={result} page={page} setPage={setPage} />
        </>
      )}
    </Resource>
  );
}
export function ProviderReviews({ providerId }) {
  const reviews = useResource(
    () => (providerId ? get(`/reviews/provider/${providerId}`) : []),
    [providerId],
  );
  return (
    <>
      <h2>Provider reviews</h2>
      {providerId && (
        <Resource resource={reviews}>
          {(rows) =>
            rows.length ? (
              <>
                <p>
                  Average rating:{" "}
                  {(
                    rows.reduce((sum, row) => sum + row.rating, 0) / rows.length
                  ).toFixed(1)}{" "}
                  / 5 ({rows.length} reviews)
                </p>
                {rows.map((row) => (
                  <article className="card" key={row.id}>
                    <strong className="review-rating">{row.rating} / 5 <span aria-hidden="true">★</span></strong>
                    <p>{row.comment || "No comment provided."}</p>
                    <small>{formatDateTime(row.createdAt)}</small>
                  </article>
                ))}
              </>
            ) : (
              <Empty>No reviews for this provider.</Empty>
            )
          }
        </Resource>
      )}
    </>
  );
}
function OfferExpiration({ value, children }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!value)
    return <Notice>Offer expiration is unavailable. Refresh before claiming.</Notice>;
  const seconds = remainingOfferSeconds(value, now);
  return (
    <>
      <p>
        Offer expires: <strong>{formatDateTime(value)}</strong>
      </p>
      <p className="muted">
        {seconds === null
          ? "The expiration timestamp could not be read. Refresh for the current offer."
          : seconds
            ? `${Math.floor(seconds / 60)}m ${seconds % 60}s remaining`
            : "The displayed offer time has passed. Refresh for its current status."}{" "}
        The server decides whether a claim is valid.
      </p>
      {children?.(seconds)}
    </>
  );
}
