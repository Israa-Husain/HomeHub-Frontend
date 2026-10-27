import { useState } from "react";
import { allPages, get, post, put, remove } from "../api";
import { useResource } from "../hooks/useResource";
import {
  ActionForm,
  ActionButton,
  Field,
  Resource,
  Empty,
  Notice,
  Status,
} from "../components/Common";
import { today, price } from "../utils/booking";
export function ProviderProfile() {
  const profile = useResource(async () => {
    try {
      return await get("/providers/profile");
    } catch (error) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  });
  return (
    <>
      <h1>Business profile</h1>
      <Resource resource={profile}>
        {(item) =>
          item ? (
            <>
              <section className="card">
                <h2>{item.businessName}</h2>
                <Status value={item.providerStatus} />
                <p>{item.description}</p>
                <p>Provider profile ID: {item.id}</p>
                <p className="muted">
                  Share this profile ID with your administrator when requesting
                  approval.
                </p>
              </section>
              <section className="card">
                <h2>Portfolio and emergency preferences</h2>
                <Notice>
                  Current portfolio text and emergency preferences are not
                  returned by the API. This form replaces both values when
                  saved.
                </Notice>
                <ActionForm
                  onSubmit={(values) =>
                    put("/providers/portfolio", {
                      description: values.description,
                      emergencyEnabled: values.emergencyEnabled === "true",
                    })
                  }
                >
                  <Field
                    name="description"
                    label="Portfolio description"
                    type="textarea"
                    maxLength="3000"
                  />
                  <Field
                    name="emergencyEnabled"
                    label="Accept emergency requests"
                    required
                    defaultValue=""
                    options={[
                      { value: "", label: "Choose a preference" },
                      { value: "true", label: "Yes" },
                      { value: "false", label: "No" },
                    ]}
                  />
                </ActionForm>
              </section>
            </>
          ) : (
            <section className="card">
              <h2>Create your business profile</h2>
              <ActionForm
                submit="Create profile"
                onSubmit={(values) => post("/providers", values)}
                onSuccess={profile.reload}
              >
                <Field name="businessName" label="Business name" required />
                <Field
                  name="description"
                  label="Business description"
                  type="textarea"
                />
              </ActionForm>
            </section>
          )
        }
      </Resource>
    </>
  );
}
export function ProviderServices() {
  const [editing, setEditing] = useState(null);
  const [created, setCreated] = useState([]);
  const categories = useResource(() => allPages("/categories"));
  const [lookup, setLookup] = useState(null);
  return (
    <>
      <h1>Manage services</h1>
      <Notice>
        The API has no “my services” listing and omits ownership IDs from
        service responses. Create services here or enter a known service ID to
        edit. The server verifies ownership.
      </Notice>
      <section className="card">
        <h2>{editing ? `Edit service #${editing.id}` : "Create service"}</h2>
        <Resource resource={categories}>
          {(rows) => (
            <ActionForm
              key={editing?.id || "new"}
              submit={editing ? "Update service" : "Create service"}
              onSubmit={(values) => {
                const body = {
                  ...values,
                  price: +values.price,
                  durationMinutes: +values.durationMinutes,
                  categoryId: +values.categoryId,
                };
                return editing
                  ? put(`/services/${editing.id}`, body)
                  : post("/services", body);
              }}
              onSuccess={(result) => {
                if (!editing) setCreated((previous) => [...previous, result]);
                setEditing(null);
                setLookup(result);
              }}
            >
              <Field
                name="name"
                label="Service name"
                defaultValue={editing?.name || ""}
                required
              />
              <Field
                name="description"
                label="Description"
                type="textarea"
                defaultValue={editing?.description || ""}
              />
              <Field
                name="price"
                label="Price"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={editing?.price || ""}
                required
              />
              <Field
                name="durationMinutes"
                label="Duration (minutes)"
                type="number"
                min="1"
                step="1"
                defaultValue={editing?.durationMinutes || ""}
                required
              />
              <Field
                name="categoryId"
                label="Category (select to confirm)"
                required
                defaultValue=""
                options={[
                  { value: "", label: "Select an active category" },
                  ...rows.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
              />
              {editing && (
                <p>
                  Current category: {editing.categoryName}. Select the intended
                  category above.
                </p>
              )}
            </ActionForm>
          )}
        </Resource>
        {editing && (
          <button onClick={() => setEditing(null)}>Cancel editing</button>
        )}
      </section>
      <section className="card">
        <h2>Find an existing service</h2>
        <ActionForm
          submit="Find service"
          success=""
          onSubmit={(values) => get(`/services/${values.serviceId}`)}
          onSuccess={setLookup}
        >
          <Field
            name="serviceId"
            label="Service ID"
            type="number"
            min="1"
            step="1"
            required
          />
        </ActionForm>
        {lookup && (
          <article>
            <h3>
              {lookup.name} · #{lookup.id}
            </h3>
            <p>
              {lookup.providerName} · {price(lookup.price)} ·{" "}
              {lookup.durationMinutes} minutes
            </p>
            <button onClick={() => setEditing(lookup)}>Edit service</button>
            <ActionButton
              action={() => remove(`/services/${lookup.id}`)}
              onSuccess={() => {
                setLookup(null);
                setEditing(null);
              }}
              confirm="Deactivate this service? New bookings will no longer be accepted."
            >
              Deactivate service
            </ActionButton>
          </article>
        )}
      </section>
      {created.length > 0 && (
        <section className="card">
          <h2>Created during this visit</h2>
          {created.map((item) => (
            <p key={item.id}>
              #{item.id} · {item.name}
            </p>
          ))}
        </section>
      )}
    </>
  );
}
export function ProviderAvailability() {
  const profile = useResource(() => get("/providers/profile"));
  const [date, setDate] = useState(today());
  const [lastBlock, setLastBlock] = useState(null);
  return (
    <>
      <h1>Availability and time off</h1>
      <Resource resource={profile}>
        {(provider) => (
          <AvailabilityPanel
            provider={provider}
            date={date}
            setDate={setDate}
            lastBlock={lastBlock}
            setLastBlock={setLastBlock}
          />
        )}
      </Resource>
    </>
  );
}
function AvailabilityPanel({
  provider,
  date,
  setDate,
  lastBlock,
  setLastBlock,
}) {
  const slots = useResource(
    () => get("/availability", { providerId: provider.id, date }),
    [provider.id, date],
  );
  return (
    <>
      <Field
        name="viewDate"
        label="View availability on"
        type="date"
        value={date}
        onChange={(event) => {
          if (event.target.value) setDate(event.target.value);
        }}
      />
      <Resource resource={slots}>
        {(rows) =>
          rows.length ? (
            rows.map((slot) => (
              <article className="card" key={slot.id}>
                <p>
                  {slot.date} · {slot.startTime}–{slot.endTime}
                </p>
                <ActionButton
                  action={() => remove(`/availability/${slot.id}`)}
                  onSuccess={slots.reload}
                  confirm="Remove this availability? The server will reject removal if it overlaps an active booking."
                >
                  Remove availability
                </ActionButton>
              </article>
            ))
          ) : (
            <Empty>No published availability for this date.</Empty>
          )
        }
      </Resource>
      <section className="card">
        <h2>Add availability or block time off</h2>
        <ActionForm
          submit="Save time period"
          onSubmit={async (values) => {
            if (values.endTime <= values.startTime)
              throw new Error("End time must be after start time.");
            const { kind, ...body } = values;
            const result = await post(
              kind === "time-off" ? "/availability/time-off" : "/availability",
              body,
            );
            if (kind === "time-off") setLastBlock(result);
            return result;
          }}
          onSuccess={slots.reload}
        >
          <Field
            name="kind"
            label="Time period type"
            options={[
              { value: "availability", label: "Available for appointments" },
              { value: "time-off", label: "Blocked time off" },
            ]}
          />
          <Field
            name="date"
            label="Date"
            type="date"
            min={today()}
            defaultValue={date}
            required
          />
          <Field name="startTime" label="Start time" type="time" required />
          <Field name="endTime" label="End time" type="time" required />
        </ActionForm>
      </section>
      <Notice>
        Blocked time off is enforced by the backend but excluded from
        availability reads. The current API cannot list or reliably remove
        blocked periods.
      </Notice>
      {lastBlock && (
        <Notice kind="success">
          Time off #{lastBlock.id} saved: {lastBlock.date},{" "}
          {lastBlock.startTime}–{lastBlock.endTime}.
        </Notice>
      )}
    </>
  );
}
export function ProviderReschedules() {
  const [result, setResult] = useState(null);
  return (
    <>
      <h1>Reschedule decisions</h1>
      <Notice>
        The backend has no endpoint to list or retrieve reschedule requests, and
        does not notify the provider when a request is created. Enter the
        request ID supplied by the homeowner. Ask them to confirm the proposed
        time before deciding.
      </Notice>
      <section className="card">
        <ActionForm
          submit="Submit decision"
          onSubmit={(values) => {
            if (
              !window.confirm(
                `Submit this reschedule decision for request #${values.id}?`,
              )
            )
              throw new Error("Decision cancelled.");
            return put(`/reschedules/${values.id}/decision`, {
              approve: values.approve === "true",
            });
          }}
          onSuccess={setResult}
        >
          <Field
            name="id"
            label="Reschedule request ID"
            type="number"
            min="1"
            step="1"
            required
          />
          <Field
            name="approve"
            label="Decision"
            required
            options={[
              { value: "", label: "Choose a decision" },
              { value: "true", label: "Approve" },
              { value: "false", label: "Reject" },
            ]}
          />
        </ActionForm>
        {result && (
          <p>
            Request #{result.id} · Booking #{result.bookingId} · Proposed{" "}
            {result.date} at {result.start} · <Status value={result.status} />
          </p>
        )}
      </section>
    </>
  );
}
