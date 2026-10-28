import { formatDateTime, formatAppointment, canApproveReschedule } from "../utils/booking";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, put } from "../api";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import {
  Resource,
  Empty,
  Field,
  Status,
  Pagination,
  ActionButton,
  Notice,
} from "../components/Common";
export function Reschedules({ bookingId, embedded = false }) {
  const Heading = bookingId || embedded ? "h2" : "h1";
  const [message,setMessage] = useState("");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const { revision } = useNotifications();
  const requests = useResource(
    () =>
      get("/reschedules", {
        bookingId,
        status: status || undefined,
        page,
        size: 12,
        sort: "createdAt,desc",
      }),
    [bookingId, status, page, revision],
  );
  return (
    <>
      <Heading>
        {bookingId
          ? "Reschedule requests for this booking"
          : "Reschedule requests"}
      </Heading>
      <Notice kind="success">{message}</Notice>
      <p className="field-hint">Requested times use Bahrain local time. Approval updates the booking; a rejected request leaves its appointment unchanged.</p>
      <Field
        name="status"
        label="Request status"
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setPage(0);
        }}
        options={[
          { value: "", label: "All statuses" },
          ...["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((value) => ({
            value,
            label: value.toLowerCase(),
          })),
        ]}
      />
      <button disabled={requests.loading} onClick={requests.reload}>Refresh requests</button>
      <Resource resource={requests}>
        {(result) => (
          <>
            {result.content.length ? (
              result.content.map((item) => (
                <RescheduleCard
                  key={item.id}
                  item={item}
                  reload={requests.reload}
                  onDecision={setMessage}
                />
              ))
            ) : (
              <Empty>No reschedule requests.</Empty>
            )}
            <Pagination result={result} page={page} setPage={setPage} />
          </>
        )}
      </Resource>
    </>
  );
}
export function RescheduleDetails() {
  const { id } = useParams();
  const { revision } = useNotifications();
  const request = useResource(() => get(`/reschedules/${id}`), [id, revision]);
  const [message,setMessage] = useState("");
  return (
    <>
      <Link to="/reschedules">All reschedule requests</Link>
      <h1>Reschedule request #{id}</h1>
      <Notice kind="success">{message}</Notice>
      <button disabled={request.loading} onClick={request.reload}>Refresh request</button>
      <Resource resource={request}>
        {(item) => <RescheduleCard item={item} reload={request.reload} onDecision={setMessage} />}
      </Resource>
    </>
  );
}
function RescheduleCard({ item, reload, onDecision }) {
  const { user } = useAuth();
  return (
    <article className="card">
      <Status value={item.status} />
      <h2>
        <Link to={`/reschedules/${item.id}`}>
          {item.serviceName} · Request #{item.id}
        </Link>
      </h2>
      <p>
        <Link to={`/bookings/${item.bookingId}`}>
          Booking #{item.bookingId}
        </Link>{" "}
        · {item.providerName} · <Status value={item.bookingStatus} />
      </p>
      <p>
        Current appointment: {formatAppointment(item.bookingDate, item.bookingStartTime, item.bookingEndTime)}
      </p>
      <p>
        Requested appointment:{" "}
        <strong>
          {formatAppointment(item.date, item.start)}
        </strong>
      </p>
      <p className="muted">Requested: {formatDateTime(item.createdAt)}</p>
      {user.role === "HOMEOWNER" && <Notice>{item.status === "PENDING" ? "Awaiting provider decision. The current appointment remains until approval succeeds." : item.status === "APPROVED" ? "The provider approved this request. Open the booking for its current appointment." : item.status === "REJECTED" ? "The provider rejected this request. Open the booking for its current appointment." : "This request was cancelled. Open the booking for its current appointment."}</Notice>}
      {user.role === "PROVIDER" && item.status === "PENDING" && <Notice>Approval requires the proposed appointment to remain at least 24 hours away. HomeHub rechecks working hours, time off and booking conflicts. Approve while the proposed appointment still meets this notice period.</Notice>}
      {user.role === "PROVIDER" && item.status === "PENDING" && !canApproveReschedule(item) && <Notice>Approval is unavailable because the requested time is too soon or the booking is no longer eligible. Refresh for its latest status.</Notice>}
      {user.role === "PROVIDER" &&
        item.status === "PENDING" &&
        ["PENDING", "CONFIRMED"].includes(item.bookingStatus) && (
          <div className="inline-links">
            {[true, false].filter(approve => !approve || canApproveReschedule(item)).map((approve) => (
              <ActionButton
                key={String(approve)}
                className={approve ? "primary" : "danger"}
                action={() => {
                  if(approve && !canApproveReschedule(item)) throw new Error("This appointment no longer meets the 24-hour notice rule. Refresh the request.");
                  return put(`/reschedules/${item.id}/decision`, { approve });
                }}
                confirm={`${approve ? "Approve" : "Reject"} request #${item.id} for ${formatAppointment(item.date, item.start)}?`}
                onSuccess={() => {onDecision?.(`Request #${item.id} ${approve ? "approved. Open the booking to view its updated appointment." : "rejected. The booking appointment was not changed by this decision."}`);reload();}}
              >
                {approve ? "Approve request" : "Reject request"}
              </ActionButton>
            ))}
          </div>
        )}
    </article>
  );
}
