import { formatDateTime, formatAppointment } from "../utils/booking";
import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage } from "../api/client";
import { label, price, bookingGuidance } from "../utils/booking";
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
export function Resource({ resource, children, keepContent = false }) {
  if (keepContent && resource.data !== null)
    return (
      <>
        {resource.loading && <Loading label="Refreshing your workspace…" compact />}
        <Notice kind="error">{resource.error}</Notice>
        {resource.error && <button onClick={resource.reload}>Try again</button>}
        {children(resource.data)}
      </>
    );
  if (resource.loading) return <Loading />;
  if (resource.error)
    return (
      <>
        <Notice kind="error">{resource.error}</Notice>
        <button onClick={resource.reload}>Try again</button>
      </>
    );
  return children(resource.data);
}
export function Loading({ label = "Loading your workspace…", compact = false }) {
  return <div className={`loading-state ${compact ? "compact" : ""}`} role="status" aria-live="polite">
    <span className="loading-spinner" aria-hidden="true" /><span>{label}</span>
  </div>;
}
export function Empty({ children = "There is nothing here yet." }) {
  return <div className="empty"><span className="empty-symbol" aria-hidden="true">◇</span><div>{children}</div></div>;
}
export function Pagination({ result, page, setPage }) {
  return (
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
  );
}
export function Field({
  name,
  label: title,
  type = "text",
  options,
  hint,
  ...props
}) {
  const generatedId = useId();
  const id = props.id || `${name}-${generatedId}`;
  const describedBy = [props["aria-describedby"], hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <label className="field" htmlFor={id}>
      <span>{title}{props.required && <span className="required-marker" aria-hidden="true"> *</span>}</span>
      {options ? (
        <select id={id} name={name} {...props} aria-describedby={describedBy}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea id={id} name={name} rows="3" {...props} aria-describedby={describedBy} />
      ) : (
        <input id={id} name={name} type={type} {...props} aria-describedby={describedBy} />
      )}
      {hint && <small id={`${id}-hint`} className="field-hint">{hint}</small>}
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
  pending = "Saving...",
  submitDisabled = false,
}) {
  const feedback = useRef(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function handle(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (lock.current || submitDisabled) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await onSubmit(
        Object.fromEntries(new FormData(form)),
        form,
      );
      await onSuccess?.(result);
      setMessage(typeof success === "function" ? success(result) : success);
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
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }
  return (
    <form
      onSubmit={handle}
      onInput={(event) => event.target.setCustomValidity?.("")}
      aria-busy={busy}
      className={`form ${className}`}
    >
      <fieldset disabled={busy}>
        {children}
        <button className="primary" type="submit" disabled={submitDisabled}>
          {busy ? pending : submit}
        </button>
      </fieldset>
      {(error || message) && <div ref={feedback} tabIndex={-1} className="form-feedback"><Notice kind={error ? "error" : "success"}>{error || message}</Notice></div>}
    </form>
  );
}
export function ActionButton({
  action,
  children,
  confirm,
  disabled = false,
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
        disabled={busy || disabled}
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
            setError(failure.response || failure.request ? errorMessage(failure) : failure.message);
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
export function ServiceCard({ service, children }) {
  return (
    <article className="card service-card">
      <small className="eyebrow">{service.categoryName}</small>
      <h2>
        <Link to={`/services/${service.id}`}>{service.name}</Link>
      </h2>
      <p>{service.description || "No description provided."}</p>
      <p className="muted">By <Link to={`/providers/${service.providerId}`}>{service.providerName}</Link></p>
      {service.emergencyEligible && <p><span className="badge emergency">Emergency available · +20%</span></p>}
      <div className="card-footer">
        <strong>{price(service.price)}</strong>
        <span>{service.durationMinutes} minutes</span>
      </div>
      <Link className="button" to={`/services/${service.id}`}>
        View service
      </Link>
      {children}
    </article>
  );
}
export function BookingCard({ booking, children }) {
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
        {formatAppointment(booking.bookingDate, booking.startTime, booking.endTime)}
      </p>
      <p className="booking-guidance">{bookingGuidance(booking)}</p>
      <strong>{price(booking.finalPrice)}</strong>
      {booking.bookingType === "EMERGENCY" && <p className="field-hint">Emergency · price includes 20% surcharge</p>}
      <Link className="button" to={`/bookings/${booking.id}`}>View booking</Link>
      {children}
      {booking.status === "PENDING" && booking.responseDeadline && (
        <p className="muted">
          Response due: {formatDateTime(booking.responseDeadline)}
        </p>
      )}
      {booking.reportDeadline &&
        ["CONFIRMED", "AWAITING_REPORT"].includes(booking.status) && (
          <p className="muted">
            Report due: {formatDateTime(booking.reportDeadline)}
          </p>
        )}
    </article>
  );
}
