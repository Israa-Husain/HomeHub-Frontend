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
export const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export function validateAppointment(date, start, hours = 24) {
  if (!date || !start) throw new Error("Please select a date and time.");
  if (!Number.isFinite(new Date(`${date}T${start}`).getTime()))
    throw new Error("Please select a valid date and time.");
  if (new Date(`${date}T${start}`).getTime() < Date.now() + hours * 3600000)
    throw new Error(
      hours
        ? `Please choose an appointment at least ${hours} hours from now.`
        : "Please choose a future appointment.",
    );
}
export const label = (value) => value?.toLowerCase().replaceAll("_", " ") || "";
export const price = (value) =>
  value == null
    ? "Price unavailable"
    : Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
