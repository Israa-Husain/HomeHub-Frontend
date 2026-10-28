import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { allPages, get, post, put, remove } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useResource } from "../hooks/useResource";
import { ActionForm, ActionButton, Field, Resource, Empty, Notice, Status, Pagination, ServiceCard } from "../components/Common";
import { today, price, formatAppointment, formatDate, formatDateTime, validateProviderPeriod, canSubmitReport, appointmentTimestamp } from "../utils/booking";
import { ProviderReviews } from "./Saved";

export async function loadProviderProfile() {
  try { return await get("/providers/profile"); }
  catch (failure) { if (failure.response?.status === 404) return null; throw failure; }
}
export function ProviderSetup({ provider }) {
  return <section className="provider-setup card">
    <div className="card-footer"><h2>{provider ? "Your business status" : "Set up your provider workspace"}</h2>{provider && <Status value={provider.providerStatus} />}</div>
    <p>{!provider ? "Start with a business profile so the HomeHub administrator can review your application." : provider.providerStatus === "PENDING" ? "Your application is awaiting administrator approval. You can complete your business information, portfolio and availability while you wait. Service creation requires approval." : provider.providerStatus === "APPROVED" ? "Your business is approved. Keep your services, working hours and portfolio up to date." : "Your business is suspended. New bookings are unavailable; editing your profile does not change your approval status."}</p>
    <ol className="onboarding-steps"><li>Create your business profile</li><li>Describe your experience and portfolio</li><li>Wait for administrator approval</li><li>Add services and publish working hours</li></ol>
    <div className="inline-links"><Link className="button" to="/provider/profile">{provider ? "Manage business profile" : "Create business profile"}</Link>{provider && <Link className="button" to="/provider/availability">Manage working hours</Link>}{provider?.providerStatus === "APPROVED" && <Link className="button primary" to="/provider/services">Manage services</Link>}</div>
  </section>;
}
export function ProviderProfile() {
  const profile = useResource(loadProviderProfile);
  const [message, setMessage] = useState("");
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Your business on HomeHub</p><h1>Business profile and portfolio</h1><p className="muted">Help homeowners understand your work and keep your business details current.</p></div><button disabled={profile.loading} onClick={profile.reload}>Refresh profile</button></div>
    <Notice kind="success">{message}</Notice>
    <Resource resource={profile} keepContent>{item => <>
      <ProviderSetup provider={item} />
      <div className="provider-columns"><section className="card"><h2>{item ? "Edit business details" : "Create your business profile"}</h2>
        <ActionForm key={item?.id || "new"} submit={item ? "Save business details" : "Create business profile"} pending="Saving business profile..." success="" submitDisabled={profile.loading || !!profile.error} onSubmit={values => {
          const body = {businessName:values.businessName.trim(),description:values.description.trim()};
          if (!body.businessName) throw new Error("Enter your business name.");
          return item ? put("/providers/profile",body) : post("/providers",body);
        }} onSuccess={() => {setMessage(item ? "Your business details have been updated." : "Business profile created. Your application is awaiting administrator approval.");profile.reload();}}>
          <Field name="businessName" maxLength={255} label="Business name" autoComplete="organization" required defaultValue={item?.businessName || ""} />
          <Field name="description" maxLength={255} label="Business description" type="textarea" hint="Explain the services you provide and the experience homeowners can expect." defaultValue={item?.description || ""} />
        </ActionForm>
      </section>
      {item && <section className="card"><h2>Portfolio and emergency preferences</h2><p className="muted">Describe your experience, specialties and previous work.</p>
        <ActionForm key={item.id} submit="Save portfolio and preferences" pending="Saving portfolio..." success="" submitDisabled={profile.loading || !!profile.error} onSubmit={values => put("/providers/portfolio",{description:values.description.trim(),emergencyEnabled:values.emergencyEnabled === "true"})} onSuccess={() => {setMessage("Your portfolio and emergency preferences have been updated.");profile.reload();}}>
          <Field name="description" label="Portfolio description" type="textarea" maxLength={3000} hint="Up to 3,000 characters." defaultValue={item.portfolioDescription || ""} />
          <Field name="emergencyEnabled" label="Accept emergency booking requests" hint="Eligible services also need their own emergency setting. Emergency bookings include a 20% surcharge." defaultValue={String(item.emergencyEnabled)} options={[{value:"false",label:"No"},{value:"true",label:"Yes"}]} />
        </ActionForm>
      </section>}</div>
      {item && <section className="card provider-preview"><p className="eyebrow">Saved profile preview</p><h2>{item.businessName}</h2><p className="preserve-lines">{item.description || "No business description provided."}</p><h3>Portfolio</h3><p className="preserve-lines">{item.portfolioDescription || "Add a portfolio description to introduce your work."}</p>{item.providerStatus === "APPROVED" && <Link to={`/providers/${item.id}`}>View provider page</Link>}</section>}
    </>}</Resource>
  </>;
}
export function ProviderDetails() {
  const { id } = useParams();
  const profile = useResource(() => get(`/providers/${id}`), [id]);
  const [page, setPage] = useState(0);
  const services = useResource(
    () => get("/services", { providerId: id, page, size: 12 }),
    [id, page],
  );
  return (
    <>
      <Link className="back-link" to="/services">← All services</Link>
      <Resource resource={profile}>
        {(item) => (
          <section className="card">
            <p className="eyebrow">Meet your service provider</p><h1>{item.businessName}</h1>
            <p className="preserve-lines">{item.description || "No business description provided."}</p>
            <h2>Portfolio</h2>
            <p className="preserve-lines">
              {item.portfolioDescription ||
                "No portfolio description provided."}
            </p>
            <p>
              Emergency requests:{" "}
              {item.emergencyEnabled
                ? "Available on eligible services with a 20% surcharge"
                : "Not accepted"}
            </p>
          </section>
        )}
      </Resource>
      <h2>Services from this provider</h2><p className="muted">Select a service to see BHD pricing and request an appointment.</p>
      <Resource resource={services}>
        {(result) => (
          <>
            {result.content.length ? (
              <div className="grid">
                {result.content.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <Empty>No available services.</Empty>
            )}
            <Pagination result={result} page={page} setPage={setPage} />
          </>
        )}
      </Resource>
      <ProviderReviews providerId={id} />
    </>
  );
}
export function ProviderServices() {
  const profile = useResource(loadProviderProfile);
  return <><div className="dashboard-heading"><div><p className="eyebrow">Your service catalogue</p><h1>Manage services</h1><p className="muted">Set clear descriptions, BHD prices and appointment durations.</p></div><div className="inline-links"><button disabled={profile.loading} onClick={profile.reload}>Refresh approval status</button><Link className="button" to="/provider/profile">Business profile</Link></div></div>
    <Resource resource={profile}>{provider => provider ? <ServiceWorkspace key={provider.id} provider={provider} /> : <ProviderSetup provider={null} />}</Resource>
  </>;
}
function ServiceWorkspace({ provider }) {
  const [editing, setEditing] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const editor = useRef(null);
  const categories = useResource(() => allPages("/categories"));
  const services = useResource(() => allPages("/services/mine", {sort:"id,desc"}));
  const focusEditor = () => requestAnimationFrame(() => {editor.current?.scrollIntoView({block:"start"});editor.current?.focus();});
  return <>
    {provider.providerStatus !== "APPROVED" && <ProviderSetup provider={provider} />}
    <Notice kind="success">{message}</Notice>
    <Notice>New services are active when created. Deactivation stops new bookings; inactive services cannot be reactivated here.</Notice>
    <div className="inline-links"><button disabled={services.loading} onClick={services.reload}>Refresh services</button>{provider.providerStatus === "APPROVED" && <button className="primary" onClick={() => {setEditing(null);setFormVersion(value => value+1);focusEditor();}}>Add a service</button>}</div>
    <Field name="serviceStatus" label="Show services" value={status} onChange={event => {setStatus(event.target.value);setPage(0);}} options={[{value:"",label:"All services"},{value:"ACTIVE",label:"Active"},{value:"INACTIVE",label:"Inactive"}]} />
    <Resource resource={services}>{rows => {
      const filtered = rows.filter(item => !status || item.status === status);
      const totalPages = Math.ceil(filtered.length/12);
      const current = Math.min(page,Math.max(0,totalPages-1));
      return <><p className="results-count">{filtered.length} services</p>{filtered.length ? <div className="grid">{filtered.slice(current*12,current*12+12).map(item => <article className="card" key={item.id}>
        <div className="card-footer"><Status value={item.status} /><small>{item.categoryName}</small></div><h2>{item.name}</h2><p className="preserve-lines">{item.description || "No description provided."}</p>
        <p><strong>{price(item.price)}</strong> · {item.durationMinutes} minutes</p><p className="field-hint">{item.emergencyEligible ? "Emergency bookings enabled · 20% surcharge" : item.emergencyEnabled && !item.providerEmergencyEnabled ? "Service emergency opt-in is on. Enable your business emergency preference for eligibility." : "Emergency bookings unavailable for this service."}</p>
        <div className="inline-links"><Link className="button" to={`/services/${item.id}`}>View service</Link><button onClick={() => {setEditing(item);focusEditor();}}>Edit service</button>{item.status === "ACTIVE" && <ActionButton className="danger" action={() => remove(`/services/${item.id}`)} onSuccess={() => {setMessage(`${item.name} has been deactivated.`);if(editing?.id === item.id)setEditing(null);services.reload();}} confirm="Deactivate this service? New bookings will stop and you cannot reactivate it from this workspace.">Deactivate</ActionButton>}</div>
      </article>)}</div> : <Empty>No services in this view. {provider.providerStatus === "APPROVED" ? "Add a service below or choose another status." : "New service creation becomes available after approval."}</Empty>}<Pagination result={{totalPages}} page={current} setPage={setPage} /></>;
    }}</Resource>
    {(editing || provider.providerStatus === "APPROVED") && <section className="card"><h2 ref={editor} tabIndex={-1}>{editing ? `Edit ${editing.name}` : "Add a service"}</h2>{editing?.status === "INACTIVE" && <Notice>Saving these details will keep this service inactive.</Notice>}
      <Resource resource={categories}>{rows => <><Notice>{!rows.length ? "No active categories are available. Ask the administrator to add an active category before creating a service." : ""}</Notice><ActionForm submitDisabled={!rows.length && !editing?.categoryId} key={`${editing?.id || "new"}-${formVersion}`} submit={editing ? "Save service" : "Create service"} pending="Saving service..." success="" onSubmit={values => {
        const body = {...values,name:values.name.trim(),description:values.description.trim(),price:+values.price,durationMinutes:+values.durationMinutes,categoryId:+values.categoryId,emergencyEnabled:values.emergencyEnabled === "true"};
        if(!body.name) throw new Error("Enter a service name.");
        if(!Number.isFinite(body.price) || body.price <= 0) throw new Error("Enter a price greater than zero.");
        if(!Number.isInteger(body.durationMinutes) || body.durationMinutes <= 0) throw new Error("Enter a duration in whole minutes greater than zero.");
        return editing ? put(`/services/${editing.id}`,body) : post("/services",body);
      }} onSuccess={() => {setMessage(editing ? "Your service details have been updated." : "Your service has been created.");setEditing(null);setFormVersion(value => value+1);services.reload();}}>
        <Field name="name" maxLength={255} label="Service name" required defaultValue={editing?.name || ""} /><Field name="description" maxLength={255} label="Service description" type="textarea" defaultValue={editing?.description || ""} />
        <div className="form-columns"><Field name="price" label="Price (BHD)" type="number" min="0.001" step="0.001" required defaultValue={editing?.price ?? ""} /><Field name="durationMinutes" label="Duration (minutes)" type="number" min="1" step="1" required defaultValue={editing?.durationMinutes || ""} /></div>
        <Field name="categoryId" label="Category" required defaultValue={editing?.categoryId || ""} options={[{value:"",label:"Select an active category"},...rows.map(row => ({value:row.id,label:row.name})),...(editing && !rows.some(row => row.id === editing.categoryId) ? [{value:editing.categoryId,label:`${editing.categoryName} (inactive)`}] : [])]} />
        <Field name="emergencyEnabled" label="Allow emergency bookings for this service" defaultValue={String(editing?.emergencyEnabled || false)} options={[{value:"false",label:"No"},{value:"true",label:"Yes"}]} hint="Requires an approved business, active service/category and emergency opt-in on your business profile. A 20% surcharge applies." />
      </ActionForm></>}</Resource>{editing && <button className="quiet" onClick={() => setEditing(null)}>Cancel editing</button>}
    </section>}
  </>;
}

export function ProviderAvailability() {
  const profile = useResource(loadProviderProfile);
  return <><div className="dashboard-heading"><div><p className="eyebrow">Plan your working day</p><h1>Availability and time off</h1><p className="muted">Publish working periods and block time off. All dates and times use Bahrain local time.</p></div><Link className="button" to="/bookings">View bookings</Link></div>
    <Resource resource={profile}>{provider => provider ? <AvailabilityPanel key={provider.id} provider={provider} /> : <ProviderSetup provider={null} />}</Resource>
  </>;
}
function AvailabilityPanel({ provider }) {
  const [date,setDate] = useState(today());
  const [editing,setEditing] = useState(null);
  const [message,setMessage] = useState("");
  const [formVersion,setFormVersion] = useState(0);
  const editor = useRef(null);
  const slots = useResource(async () => {
    const [available,blocked] = await Promise.all([get("/availability",{providerId:provider.id,date}),get("/availability",{providerId:provider.id,date,timeOff:true})]);
    return [...available,...blocked].sort((a,b) => a.startTime.localeCompare(b.startTime));
  },[date,provider.id]);
  const pastDate = date < today();
  return <>
    <Notice>Availability defines your working hours. Time off blocks an interval; removing a block restores only existing availability. Changes that overlap active bookings may be rejected.</Notice><Notice kind="success">{message}</Notice>
    <div className="period-toolbar"><Field name="viewDate" label="View schedule date" type="date" value={date} onChange={event => {if(event.target.value){setDate(event.target.value);setEditing(null);setMessage("");}}} /><button disabled={slots.loading} onClick={slots.reload}>Refresh periods</button><button onClick={() => {setDate(today());setEditing(null);}}>Today</button></div>
    <h2>{formatDate(date)}</h2>
    <Resource resource={slots}>{rows => rows.length ? <div className="grid">{rows.map(slot => <article className={`card period-card ${slot.timeOff ? "time-off" : "working"}`} key={slot.id}>
      <span className={`badge ${slot.timeOff ? "pending" : "confirmed"}`}>{slot.timeOff ? "Time off" : "Working hours"}</span><h3>{formatAppointment(slot.date,slot.startTime,slot.endTime)}</h3>
      <div className="inline-links">{slot.date >= today() && <button onClick={() => {setEditing(slot);requestAnimationFrame(() => {editor.current?.scrollIntoView({block:"start"});editor.current?.focus();});}}>Edit period</button>}
        <ActionButton className="danger" action={() => remove(`/availability/${slot.id}`)} onSuccess={() => {setEditing(null);setMessage(slot.timeOff ? "Time-off block removed. Existing working hours now apply." : "Working period removed.");slots.reload();}} confirm={slot.timeOff ? "Remove this time-off block? This does not create new working hours." : "Remove this working period? Existing booking conflicts may prevent removal."}>Remove period</ActionButton></div>
    </article>)}</div> : <Empty>No working hours or time-off blocks for this date. {pastDate ? "Choose today or a future date to add a period." : "Add a working period or time off below."}</Empty>}</Resource>
    {!pastDate && <section className="card"><h2 ref={editor} tabIndex={-1}>{editing ? "Edit period" : "Add working hours or time off"}</h2><p className="field-hint">Each period belongs to one date. End time must be later than start time; editing keeps its original period type.</p>
      <ActionForm key={`${editing?.id || "new"}-${date}-${formVersion}`} submit={editing ? "Save period" : "Add period"} pending="Saving period..." success="" onSubmit={values => {
        validateProviderPeriod(values.date,values.startTime,values.endTime);
        const {kind,...body} = values;
        return editing ? put(`/availability/${editing.id}`,body) : post(kind === "time-off" ? "/availability/time-off" : "/availability",body);
      }} onSuccess={result => {setDate(result.date);setEditing(null);setFormVersion(value => value+1);setMessage("Schedule period saved. Your working hours and blocks are shown above.");slots.reload();}}>
        {!editing ? <Field name="kind" label="Period type" options={[{value:"availability",label:"Working hours · accept appointments"},{value:"time-off",label:"Time off · block appointments"}]} /> : <Notice>{editing.timeOff ? "Editing a time-off block" : "Editing working hours"}</Notice>}
        <Field name="date" label="Date (Bahrain)" type="date" min={today()} required defaultValue={editing?.date || date} />
        <div className="form-columns"><Field name="startTime" label="Start time (Bahrain)" type="time" required defaultValue={editing?.startTime || ""} /><Field name="endTime" label="End time (Bahrain)" type="time" required defaultValue={editing?.endTime || ""} /></div>
      </ActionForm>{editing && <button className="quiet" onClick={() => setEditing(null)}>Cancel editing</button>}
    </section>}
  </>;
}


export function ProviderOverview() {
  const { user } = useAuth();
  const notifications = useNotifications();
  const profile = useResource(loadProviderProfile);
  const bookings = useResource(() => allPages("/booking", {sort:"bookingDate,asc"}), [notifications.revision]);
  const requests = useResource(() => get("/reschedules", {status:"PENDING",page:0,size:1}), [notifications.revision]);
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Provider workspace</p><h1>Welcome, {user.firstName}</h1><p className="muted">Your appointments, responses and follow-up work in one place.</p></div><div className="inline-links"><Link className="button primary" to="/bookings?status=PENDING">Review booking requests</Link><Link className="button" to="/provider/availability">Manage working hours</Link><Link className="button" to="/notifications">Notifications ({notifications.count})</Link></div></div>
    <Resource resource={profile}>{provider => <ProviderSetup provider={provider} />}</Resource>
    <Resource resource={bookings}>{rows => {
      const now = Date.now();
      const pending = rows.filter(row => row.status === "PENDING");
      const reportReady = rows.filter(row => canSubmitReport(row,now));
      const upcoming = rows.filter(row => row.status === "CONFIRMED" && appointmentTimestamp(`${row.bookingDate}T${row.startTime}`) > now).sort((a,b) => `${a.bookingDate}T${a.startTime}`.localeCompare(`${b.bookingDate}T${b.startTime}`));
      const attention = [...pending,...reportReady].sort((a,b) => {
        const aDeadline = a.status === "PENDING" ? a.responseDeadline : a.reportDeadline;
        const bDeadline = b.status === "PENDING" ? b.responseDeadline : b.reportDeadline;
        return (aDeadline || "9999").localeCompare(bDeadline || "9999");
      });
      return <>
        <div className="stats-grid"><Link className="stat-card" to="/bookings?status=PENDING"><span>Awaiting your response</span><strong>{pending.length}</strong><small>Review requests →</small></Link><Link className="stat-card" to="/bookings?status=CONFIRMED"><span>Upcoming confirmed visits</span><strong>{upcoming.length}</strong><small>View appointments →</small></Link><Link className="stat-card" to="/bookings"><span>Ready for report / completion</span><strong>{reportReady.length}</strong><small>Review follow-up work →</small></Link></div>
        <section><h2>Needs your attention</h2><p className="field-hint">Follow-up counts use appointment end times and booking statuses. Open each booking to check whether its report has already been submitted.</p>
          {attention.length ? <div className="grid">{attention.slice(0,6).map(row => <article className="card provider-attention" key={row.id}><Status value={row.status} /><h3>{row.serviceName}</h3><p>{formatAppointment(row.bookingDate,row.startTime,row.endTime)}</p><p><strong>{row.status === "PENDING" ? "Respond by" : "Report deadline"}:</strong> {row.status === "PENDING" ? formatDateTime(row.responseDeadline) : row.reportDeadline ? formatDateTime(row.reportDeadline) : "Not supplied"}</p><Link className="button primary" to={`/bookings/${row.id}`}>{row.status === "PENDING" ? "Review request" : "View report and completion"}</Link></article>)}</div> : <Empty>No booking responses or report follow-ups currently need your attention.</Empty>}
        </section>
        <section><h2>Upcoming confirmed appointments</h2>{upcoming.length ? <div className="grid">{upcoming.slice(0,3).map(row => <article className="card" key={row.id}><h3>{row.serviceName}</h3><p>{formatAppointment(row.bookingDate,row.startTime,row.endTime)}</p><strong>{price(row.finalPrice)}</strong><p><Link to={`/bookings/${row.id}`}>Open booking #{row.id}</Link></p></article>)}</div> : <Empty>No upcoming confirmed appointments.</Empty>}</section>
      </>;
    }}</Resource>
    <section className="card"><h2>Reschedule decisions</h2><Resource resource={requests}>{result => <p>{result.totalElements} pending reschedule requests.</p>}</Resource><Link className="button" to="/provider/reschedules">Review reschedule requests</Link></section>
    <section><div className="card-footer"><h2>Recent notifications</h2><Link to="/notifications">View all notifications</Link></div><Notice kind="error">{notifications.error}</Notice>{notifications.loading && !notifications.loaded ? <p role="status">Loading notifications...</p> : notifications.items.length ? notifications.items.slice(0,4).map(item => <article className={`card notification ${item.read ? "" : "unread"}`} key={item.id}><p>{item.message}</p><Link to="/notifications">Open notifications</Link></article>) : notifications.loaded && <Empty>No notifications yet.</Empty>}</section>
  </>;
}
