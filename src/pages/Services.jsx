import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { allPages, get, post, remove, bookingApi } from "../api";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import {
  Resource,
  ServiceCard,
  Empty,
  Field,
  ActionForm,
  Notice,
  ActionButton,
} from "../components/Common";
import { price, today, validateAppointment } from "../utils/booking";
export function Services() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const categories = useResource(() => allPages("/categories"));
  const services = useResource(
    () =>
      get(
        filters.name || filters.minPrice || filters.maxPrice
          ? "/services/search"
          : "/services",
        { ...filters, page, size: 12 },
      ),
    [JSON.stringify(filters), page],
  );
  return (
    <>
      <h1>Browse services</h1>
      <p className="muted">
        Find the service that fits your home. Prices are shown as supplied by
        the provider.
      </p>
      <ActionForm
        className="filter-form"
        submit="Search"
        success=""
        onSubmit={(values) => {
          if (
            values.minPrice &&
            values.maxPrice &&
            +values.minPrice > +values.maxPrice
          )
            throw new Error("Minimum price cannot exceed maximum price.");
          setFilters(
            Object.fromEntries(
              Object.entries(values).filter(([, value]) => value !== ""),
            ),
          );
          setPage(0);
        }}
      >
        <Field name="name" label="Service name" />
        <Field
          name="categoryId"
          label="Category"
          options={[
            { value: "", label: "All categories" },
            ...(categories.data || []).map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
        />
        <Field
          name="minPrice"
          label="Minimum price"
          type="number"
          min="0"
          step="0.01"
        />
        <Field
          name="maxPrice"
          label="Maximum price"
          type="number"
          min="0"
          step="0.01"
        />
        <Field
          name="sort"
          label="Sort by"
          options={[
            { value: "name,asc", label: "Name" },
            { value: "price,asc", label: "Price: low to high" },
            { value: "price,desc", label: "Price: high to low" },
          ]}
        />
      </ActionForm>
      <Notice kind="error">{categories.error}</Notice>
      <Resource resource={services}>
        {(result) => (
          <>
            {!result.content.length ? (
              <Empty>No services match your search.</Empty>
            ) : (
              <div className="grid">
                {result.content.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
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
export function ServiceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const service = useResource(() => get(`/services/${id}`), [id]);
  const categories = useResource(() => allPages("/categories"));
  const favorites = useResource(
    () => (user.role === "HOMEOWNER" ? get("/favorites") : []),
    [id, user.role],
  );
  const favorite = favorites.data?.find(
    (item) => String(item.serviceId) === id,
  );
  return (
    <>
      <Link to="/services">← All services</Link>
      <Resource resource={service}>
        {(item) => (
          <>
            <section className="card">
              <p className="eyebrow">{item.categoryName}</p>
              <h1>{item.name}</h1>
              <p>{item.description || "No description provided."}</p>
              <p>
                Provided by <strong>{item.providerName}</strong>
              </p>
              <p>
                {price(item.price)} · {item.durationMinutes} minutes
              </p>
              {user.role === "HOMEOWNER" && (
                <>
                  <Resource resource={favorites}>
                    {() => (
                      <ActionButton
                        action={() =>
                          favorite
                            ? remove(`/favorites/${favorite.id}`)
                            : post(`/favorites/${id}`)
                        }
                        onSuccess={favorites.reload}
                      >
                        {favorite
                          ? "Remove from favorites"
                          : "Save to favorites"}
                      </ActionButton>
                    )}
                  </Resource>
                  <Resource resource={categories}>
                    {(rows) =>
                      rows.some(
                        (category) => category.name === item.categoryName,
                      ) ? (
                        <BookingForm service={item} />
                      ) : (
                        <Notice>
                          This service's category is inactive. New appointment
                          requests are unavailable.
                        </Notice>
                      )
                    }
                  </Resource>
                </>
              )}
            </section>
            <Notice>
              Provider availability and reviews cannot be linked to this service
              because its API response does not include the provider ID.
              Appointment requests are validated by the server.
            </Notice>
          </>
        )}
      </Resource>
    </>
  );
}
export function BookingForm({ service, waitlist = false }) {
  const navigate = useNavigate();
  const homes = useResource(() => allPages("/homes"));
  const [type, setType] = useState("NORMAL");
  return (
    <section>
      <h2>{waitlist ? "Join the waitlist" : "Request an appointment"}</h2>
      <Resource resource={homes}>
        {(items) =>
          items.filter((home) => home.active).length ? (
            <ActionForm
              submit={waitlist ? "Join waitlist" : "Submit booking request"}
              onSubmit={async (values) => {
                validateAppointment(
                  values.bookingDate,
                  values.startTime,
                  values.bookingType === "EMERGENCY" && !waitlist ? 0 : 24,
                );
                const body = {
                  ...values,
                  homeId: +values.homeId,
                  serviceId: service.id,
                };
                if (waitlist)
                  return post("/waitlist", {
                    serviceId: service.id,
                    homeId: body.homeId,
                    date: values.bookingDate,
                    start: values.startTime,
                  });
                return bookingApi.create(body);
              }}
              onSuccess={
                waitlist
                  ? undefined
                  : (result) =>
                      navigate(`/bookings/${result.id}`, {
                        state: { created: true },
                      })
              }
              success={
                waitlist
                  ? "You have joined the waitlist. A slot is only booked after a successful offer claim."
                  : "Your booking has been submitted."
              }
            >
              <Field
                name="homeId"
                label="Home"
                required
                options={[
                  { value: "", label: "Select a home" },
                  ...items
                    .filter((home) => home.active)
                    .map((home) => ({
                      value: home.id,
                      label: `${home.name} · ${home.city}`,
                    })),
                ]}
              />
              <Field
                name="bookingDate"
                label="Appointment date"
                type="date"
                min={today()}
                required
              />
              <Field
                name="startTime"
                label="Requested start time"
                type="time"
                required
              />
              {!waitlist && (
                <>
                  <Field
                    name="bookingType"
                    label="Booking type"
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    options={[
                      {
                        value: "NORMAL",
                        label: "Normal — at least 24 hours notice",
                      },
                      {
                        value: "EMERGENCY",
                        label: "Emergency — eligibility checked on submission",
                      },
                    ]}
                  />
                  <Field
                    name="note"
                    label="Notes for the provider"
                    type="textarea"
                  />
                </>
              )}
              <p>
                Estimated price:{" "}
                <strong>
                  {price(
                    service.price *
                      (type === "EMERGENCY" && !waitlist ? 1.2 : 1),
                  )}
                </strong>
                {type === "EMERGENCY" && !waitlist
                  ? " (includes 20% surcharge)"
                  : ""}
                . Final price and availability are confirmed by the server.
              </p>
              {type === "EMERGENCY" && (
                <Notice>
                  Emergency eligibility is not returned by this API. The server
                  may reject this request. New services cannot currently enable
                  emergency bookings through the available service endpoints.
                </Notice>
              )}
            </ActionForm>
          ) : (
            <Empty>
              Add an active <Link to="/homes">home</Link> before booking.
            </Empty>
          )
        }
      </Resource>
      {!waitlist && (
        <details>
          <summary>Need a time that is already booked?</summary>
          <BookingForm service={service} waitlist />
        </details>
      )}
    </section>
  );
}
