import { Link } from "react-router-dom";
import { useState } from "react";
import { get, post, remove } from "../api";
import { useResource } from "../hooks/useResource";
import { useNotifications } from "../context/NotificationContext";
import {
  Resource,
  Empty,
  ServiceCard,
  ActionButton,
  Status,
  Notice,
  Field,
  ActionForm,
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
        } catch {
          return favorite;
        }
      }),
    );
  });
  return (
    <>
      <h1>Favorite services</h1>
      <Resource resource={favorites}>
        {(rows) =>
          rows.length ? (
            <div className="grid">
              {rows.map((item) => (
                <div key={item.id}>
                  {item.service ? (
                    <ServiceCard service={item.service} />
                  ) : (
                    <article className="card">
                      Service #{item.serviceId} is unavailable.
                    </article>
                  )}
                  <ActionButton
                    action={() => remove(`/favorites/${item.id}`)}
                    onSuccess={favorites.reload}
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
      <h1>My waitlist</h1>
      <p>Join a waitlist from a service's appointment form.</p>
      <Notice>
        The API does not return offer expiration times. An offer can expire
        before you claim it; the slot is booked only after the server confirms
        the claim.
      </Notice>
      {claimed && (
        <Notice kind="success">
          Offer claimed.{" "}
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
                  <h2>
                    <Link to={`/services/${item.serviceId}`}>
                      Service #{item.serviceId}
                    </Link>
                  </h2>
                  <p>
                    Home #{item.homeId} · {item.date} at {item.start}
                  </p>
                  {item.status === "OFFERED" && (
                    <ActionButton
                      action={() => post(`/waitlist/${item.id}/claim`)}
                      onSuccess={(booking) => {
                        setClaimed(booking);
                        entries.reload();
                      }}
                      confirm="Claim this offer and create a booking?"
                    >
                      Claim offer
                    </ActionButton>
                  )}
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
            <Empty>No waitlist entries.</Empty>
          )
        }
      </Resource>
    </>
  );
}
export function Notifications() {
  const { items, count, error, connection, refresh, markRead } =
    useNotifications();
  return (
    <>
      <h1>Notifications</h1>
      <p>
        {count} unread · Updates: {connection.toLowerCase()}
      </p>
      <button onClick={refresh}>Refresh notifications</button>
      <Notice kind="error">{error}</Notice>
      {items.length ? (
        items.map((item) => (
          <article
            className={`card notification ${item.read ? "" : "unread"}`}
            key={item.id}
          >
            <p>{item.message}</p>
            <small>{item.read ? "Read" : "Unread"}</small>
            {!item.read && (
              <ActionButton action={() => markRead(item.id)}>
                Mark as read
              </ActionButton>
            )}
          </article>
        ))
      ) : (
        <Empty>No notifications yet.</Empty>
      )}
    </>
  );
}
export function Reviews() {
  const [providerId, setProviderId] = useState("");
  const reviews = useResource(
    () => (providerId ? get(`/reviews/provider/${providerId}`) : []),
    [providerId],
  );
  return (
    <>
      <h1>Provider reviews</h1>
      <p>
        Enter a known provider profile ID to view their reviews. The API does
        not include provider IDs in service listings.
      </p>
      <ActionForm
        submit="View reviews"
        success=""
        onSubmit={(values) => setProviderId(values.providerId)}
      >
        <Field
          name="providerId"
          label="Provider profile ID"
          type="number"
          min="1"
          step="1"
          required
        />
      </ActionForm>
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
                    <strong>{row.rating} / 5</strong>
                    <p>{row.comment || "No comment provided."}</p>
                    <small>Booking #{row.bookingId}</small>
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
