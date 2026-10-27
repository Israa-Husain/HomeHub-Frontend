import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage } from "../api/client";
import { label, price } from "../utils/booking";
export function Notice({ children, kind = "info" }) {
  return children ? (
    <div
      className={`notice ${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
export function Status({ value }) {
  return (
    <span className={`badge ${value?.toLowerCase()}`}>{label(value)}</span>
  );
}
export function Resource({ resource, children }) {
  if (resource.loading) return <p role="status">Loading…</p>;
  if (resource.error)
    return (
      <>
        <Notice kind="error">{resource.error}</Notice>
        <button onClick={resource.reload}>Try again</button>
      </>
    );
  return children(resource.data);
}
export function Empty({ children = "There is nothing here yet." }) {
  return <p className="empty">{children}</p>;
}
export function Field({
  name,
  label: title,
  type = "text",
  options,
  ...props
}) {
  const generatedId = useId();
  const id = props.id || `${name}-${generatedId}`;
  return (
    <label className="field" htmlFor={id}>
      <span>{title}</span>
      {options ? (
        <select id={id} name={name} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea id={id} name={name} rows="3" {...props} />
      ) : (
        <input id={id} name={name} type={type} {...props} />
      )}
    </label>
  );
}
export function ActionForm({
  onSubmit,
  children,
  submit = "Save",
  success = "Your changes have been saved.",
  className = "",
  onSuccess,
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function handle(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await onSubmit(
        Object.fromEntries(new FormData(form)),
        form,
      );
      setMessage(typeof success === "function" ? success(result) : success);
      await onSuccess?.(result);
    } catch (failure) {
      const validation =
        failure.response?.data?.message?.match(/^([a-zA-Z]+): (.+)$/);
      const field = validation && form.elements.namedItem(validation[1]);
      if (field?.setCustomValidity) {
        field.setCustomValidity(validation[2]);
        setTimeout(() => field.reportValidity(), 0);
      }
      setError(
        failure.response || failure.request
          ? errorMessage(failure)
          : failure.message,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={handle}
      onInput={(event) => event.target.setCustomValidity?.("")}
      className={`form ${className}`}
    >
      <fieldset disabled={busy}>
        {children}
        <button className="primary" type="submit">
          {busy ? "Saving…" : submit}
        </button>
      </fieldset>
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{message}</Notice>
    </form>
  );
}
export function ActionButton({
  action,
  children,
  confirm,
  onSuccess,
  className = "",
}) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  return (
    <span className="action">
      <button
        className={className}
        disabled={busy}
        onClick={async () => {
          if (lock.current || (confirm && !window.confirm(confirm))) return;
          lock.current = true;
          setBusy(true);
          setError("");
          setDone(false);
          try {
            const result = await action();
            setDone(true);
            await onSuccess?.(result);
          } catch (failure) {
            setError(errorMessage(failure));
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        {busy ? "Working…" : children}
      </button>
      {error && <Notice kind="error">{error}</Notice>}
      {done && !onSuccess && <Notice kind="success">Saved.</Notice>}
    </span>
  );
}
export function ServiceCard({ service }) {
  return (
    <article className="card">
      <small>{service.categoryName}</small>
      <h2>
        <Link to={`/services/${service.id}`}>{service.name}</Link>
      </h2>
      <p>{service.description || "No description provided."}</p>
      <p className="muted">{service.providerName}</p>
      <div className="card-footer">
        <strong>{price(service.price)}</strong>
        <span>{service.durationMinutes} minutes</span>
      </div>
      <Link className="button" to={`/services/${service.id}`}>
        View service
      </Link>
    </article>
  );
}
export function BookingCard({ booking }) {
  return (
    <article className="card">
      <div className="card-footer">
        <small>Booking #{booking.id}</small>
        <Status value={booking.status} />
      </div>
      <h2>
        <Link to={`/bookings/${booking.id}`}>{booking.serviceName}</Link>
      </h2>
      <p>{booking.providerName}</p>
      <p>
        {booking.bookingDate} · {booking.startTime}–{booking.endTime}
      </p>
      <strong>{price(booking.finalPrice)}</strong>
      {booking.status === "PENDING" && booking.responseDeadline && (
        <p className="muted">
          Response due: {booking.responseDeadline.replace("T", " ")}
        </p>
      )}
    </article>
  );
}
