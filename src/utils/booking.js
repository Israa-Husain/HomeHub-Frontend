export const statuses = [
  "PENDING",
  "CONFIRMED",
  "AWAITING_REPORT",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
];
export const transitions = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["AWAITING_REPORT", "COMPLETED", "CANCELLED"],
  AWAITING_REPORT: ["COMPLETED"],
};
export const activeBooking = (status) =>
  ["PENDING", "CONFIRMED", "AWAITING_REPORT"].includes(status);
export const APPOINTMENT_TIME_ZONE = "Asia/Bahrain";
//The API's local appointment/deadline strings represent Bahrain time, not browser time.
export function appointmentTimestamp(value) {
  if (typeof value !== "string" || !value) return NaN;
  const local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/;
  return Date.parse(local.test(value) ? `${value}+03:00` : value);
}
export function remainingOfferSeconds(value, now = Date.now()) {
  const expiry = appointmentTimestamp(value);
  return Number.isFinite(expiry)
    ? Math.max(0, Math.ceil((expiry - now) / 1000))
    : null;
}
export const today = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APPOINTMENT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};
export function validateAppointment(date, start, hours = 24) {
  if (!date || !start) throw new Error("Please select a date and time.");
  const startsAt = appointmentTimestamp(`${date}T${start}`);
  if (!Number.isFinite(startsAt))
    throw new Error("Please select a valid date and time.");
  if (startsAt < Date.now() + hours * 3600000 || startsAt <= Date.now())
    throw new Error(
      hours
        ? `Please choose an appointment at least ${hours} hours from now.`
        : "Please choose a future appointment.",
    );
}
export const label = (value) => value?.toLowerCase().replaceAll("_", " ") || "";
const money = new Intl.NumberFormat("en-BH", {
  style: "currency", currency: "BHD", currencyDisplay: "code",
  minimumFractionDigits: 3, maximumFractionDigits: 3,
});
export const price = (value) =>
  value == null || value === "" || !Number.isFinite(Number(value))
    ? "Price unavailable" : money.format(Number(value));

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: APPOINTMENT_TIME_ZONE, day: "numeric", month: "short", year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: APPOINTMENT_TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: true,
});
export function formatDate(value) {
  const stamp = appointmentTimestamp(/^\d{4}-\d{2}-\d{2}$/.test(value || "") ? `${value}T12:00:00` : value);
  return Number.isFinite(stamp) ? dateFormat.format(stamp) : "Date unavailable";
}
export function formatTime(value) {
  const stamp = appointmentTimestamp(/^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value || "") ? `2000-01-01T${value}` : value);
  return Number.isFinite(stamp) ? timeFormat.format(stamp) : "Time unavailable";
}
export function formatDateTime(value) {
  return Number.isFinite(appointmentTimestamp(value))
    ? `${formatDate(value)}, ${formatTime(value)} (Bahrain)` : "Date unavailable";
}
export function formatAppointment(date, start, end) {
  return `${formatDate(date)} · ${formatTime(start)}${end ? ` – ${formatTime(end)}` : ""}`;
}

// These are presentation groups, not additional backend booking statuses.
export function homeownerBookingGroup(booking, now = Date.now()) {
  if (booking.status === "PENDING") return "pending";
  if (booking.status === "COMPLETED") return "completed";
  if (booking.status === "CANCELLED") return "cancelled";
  if (booking.status === "AWAITING_REPORT") return "ongoing";
  const start = appointmentTimestamp(`${booking.bookingDate}T${booking.startTime}`);
  if (booking.status === "CONFIRMED" && Number.isFinite(start) && start <= now) return "ongoing";
  if (booking.status === "CONFIRMED" && Number.isFinite(start) && start > now) return "upcoming";
  return "other";
}
export function bookingGuidance(booking, now = Date.now()) {
  if (booking.status === "PENDING") {
    const deadline = appointmentTimestamp(booking.responseDeadline);
    const start = appointmentTimestamp(
      `${booking.bookingDate}T${booking.startTime}`
    );

    if (Number.isFinite(deadline) && deadline <= now)
      return "Overdue — the provider response deadline has passed. Status remains pending.";

    if (Number.isFinite(start) && start <= now)
      return "Overdue — the appointment start time has passed. Status remains pending.";

    return "Awaiting provider acceptance. This request is not yet confirmed.";
  }
  return {
    CONFIRMED: "Your appointment has been accepted by the provider.",
    AWAITING_REPORT: "Awaiting the provider's service report and completion update.",
    COMPLETED: "Service completed. Open the booking to view its report and your review options.",
    CANCELLED: "This booking was cancelled and will not take place.",
    REJECTED: "The provider declined this request. You can browse for another service.",
    EXPIRED: "This request expired. Choose a new appointment if you still need the service.",
  }[booking.status] || "Open the booking for its current details.";
}

export function validateProviderPeriod(date, start, end) {
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !time.test(start || "") || !time.test(end || ""))
    throw new Error("Choose a date and valid start and end times.");
  const startsAt = appointmentTimestamp(`${date}T${start}`);
  const endsAt = appointmentTimestamp(`${date}T${end}`);
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) throw new Error("Choose a valid schedule date.");
  if (date < today()) throw new Error("Choose today or a future date in Bahrain.");
  if (endsAt <= startsAt) throw new Error("End time must be after start time on the same date.");
}
export function canSubmitReport(booking, now = Date.now()) {
  return ["CONFIRMED", "AWAITING_REPORT"].includes(booking.status)
    && appointmentTimestamp(`${booking.bookingDate}T${booking.endTime}`) <= now;
}
export function providerBookingActions(booking, hasReport = false, now = Date.now()) {
  const deadline = appointmentTimestamp(booking.responseDeadline);
  if (booking.status === "PENDING" && Number.isFinite(deadline) && deadline <= now) return [];
  const start = appointmentTimestamp(`${booking.bookingDate}T${booking.startTime}`);
  return (transitions[booking.status] || []).filter(status =>
    (status !== "CONFIRMED" || (Number.isFinite(start) && start > now))
    && (status !== "COMPLETED" || (hasReport && canSubmitReport(booking, now)))
    && (status !== "AWAITING_REPORT" || canSubmitReport(booking, now)));
}
export function canApproveReschedule(request, now = Date.now()) {
  return request.status === "PENDING" && ["PENDING", "CONFIRMED"].includes(request.bookingStatus)
    && appointmentTimestamp(`${request.date}T${request.start}`) >= now + 24 * 3600000;
}
