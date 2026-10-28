import { useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { allPages, get, post, remove, bookingApi } from "../api";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import { Resource, ServiceCard, Empty, Field, ActionForm, Notice, ActionButton, Pagination } from "../components/Common";
import { price, today, validateAppointment, formatTime, formatAppointment } from "../utils/booking";
import { ProviderReviews } from "./Saved";

export function Services() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [searchKey, setSearchKey] = useState(0);
  const categories = useResource(() => allPages("/categories"));
  const services = useResource(() => get(
    filters.name || filters.minPrice || filters.maxPrice ? "/services/search" : "/services",
    { ...filters, page, size: 12 },
  ), [JSON.stringify(filters), page]);
  const clear = () => { setFilters({}); setPage(0); setSearchKey(value => value + 1); };
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Home services across Bahrain</p><h1>Find the right help for your home</h1><p className="muted">Compare providers, explore services and choose an appointment. All prices are in BHD.</p></div></div>
    <ActionForm key={searchKey} className="filter-form service-search" submit="Find services" pending="Searching..." success="" onSubmit={values => {
      const cleaned = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value !== ""));
      if (cleaned.minPrice && cleaned.maxPrice && +cleaned.minPrice > +cleaned.maxPrice) throw new Error("Minimum price cannot exceed maximum price.");
      setFilters(cleaned); setPage(0);
    }}>
      <Field name="name" maxLength={255} label="Search services" placeholder="Search home services" />
      <Field name="categoryId" label="Category" disabled={categories.loading || !!categories.error} options={[{value:"", label:categories.loading ? "Loading categories..." : "All categories"}, ...(categories.data || []).map(category => ({value:category.id,label:category.name}))]} />
      <Field name="minPrice" label="Min. price (BHD)" type="number" min="0" step="0.001" />
      <Field name="maxPrice" label="Max. price (BHD)" type="number" min="0" step="0.001" />
      <Field name="sort" label="Sort by" options={[{value:"name,asc",label:"Name: A–Z"},{value:"price,asc",label:"Price: low to high"},{value:"price,desc",label:"Price: high to low"}]} />
    </ActionForm>
    <div className="inline-links"><button onClick={clear}>Clear filters</button><button onClick={services.reload} disabled={services.loading}>Refresh results</button></div>
    <Notice kind="error">{categories.error}</Notice>
    {categories.error && <button onClick={categories.reload}>Retry categories</button>}
    <Resource resource={services}>{result => <>
      <p className="results-count" role="status">{result.totalElements} {result.totalElements === 1 ? "service" : "services"} found</p>
      {!result.content.length ? <Empty>No services match these filters. Try a different category or <button onClick={clear}>clear your filters</button>.</Empty> : <div className="grid">{result.content.map(service => <ServiceCard key={service.id} service={service} />)}</div>}
      <Pagination result={result} page={page} setPage={setPage} />
    </>}</Resource>
  </>;
}

export function ServiceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const service = useResource(() => get(`/services/${id}`), [id]);
  const favorites = useResource(() => user.role === "HOMEOWNER" ? get("/favorites") : [], [id, user.role]);
  const favorite = favorites.data?.find(item => String(item.serviceId) === id);
  return <>
    <Link className="back-link" to="/services">← All services</Link>
    <Resource resource={service}>{item => <>
      <section className="card service-detail">
        <p className="eyebrow">{item.categoryName}</p><h1>{item.name}</h1>
        <p className="preserve-lines">{item.description || "No description provided."}</p>
        <dl className="service-facts"><dt>Provider</dt><dd><Link to={`/providers/${item.providerId}`}>{item.providerName}</Link></dd><dt>Standard price</dt><dd><strong>{price(item.price)}</strong></dd><dt>Duration</dt><dd>{item.durationMinutes} minutes</dd><dt>Emergency bookings</dt><dd>{item.emergencyEligible ? "Available · 20% surcharge applies" : "Not available for this service"}</dd></dl>
        {user.role === "HOMEOWNER" && <Resource resource={favorites}>{() => <ActionButton action={() => favorite ? remove(`/favorites/${favorite.id}`) : post(`/favorites/${id}`)} onSuccess={favorites.reload}>{favorite ? "Remove from favorites" : "Save to favorites"}</ActionButton>}</Resource>}
      </section>
      {user.role === "HOMEOWNER" && (item.status === "ACTIVE" && item.categoryStatus === "ACTIVE" && item.providerStatus === "APPROVED" ? <section className="card"><BookingForm key={item.id} service={item} /></section> : <Notice>This service is unavailable for new appointments. <Link to="/services">Find another service</Link>.</Notice>)}
      <section><ProviderReviews providerId={item.providerId} /></section>
    </>}</Resource>
  </>;
}

export function BookingForm({ service, waitlist = false }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const homes = useResource(() => allPages("/homes"));
  const [type, setType] = useState("NORMAL");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [homeId, setHomeId] = useState(params.get("homeId") || "");
  const [joined, setJoined] = useState(null);
  const slotKey = `${service.id}:${date}:${type}`;
  const slots = useResource(async () => ({ key: slotKey, times: date && !waitlist ? await get("/booking/available-times", {serviceId:service.id,date,bookingType:type}) : [] }), [date, type, service.id, waitlist]);
  const times = slots.data?.key === slotKey ? slots.data.times : [];
  const ready = waitlist || (!slots.loading && !slots.error && times.includes(time));
  const emergency = !waitlist && type === "EMERGENCY";
  const base = service.price;
  return <section className="booking-section">
    <h2>{waitlist ? "Join an appointment waitlist" : "Plan your appointment"}</h2>
    <p className="muted">{waitlist ? "For an occupied time within the provider's working hours. Joining does not create a booking." : "Choose your home, booking type and an available time. Your provider must accept the request."}</p>
    <Resource resource={homes} keepContent>{items => {
      const active = items.filter(home => home.active);
      const selected = active.find(home => String(home.id) === homeId);
      return active.length ? <>
        {joined && <Notice kind="success">Waitlist entry #{joined.id} created. <Link to="/waitlist">View your waitlist and offers</Link>.</Notice>}
        <ActionForm submit={waitlist ? "Join waitlist" : "Submit booking request"} pending={waitlist ? "Joining waitlist..." : "Submitting request..."} submitDisabled={homes.loading || !!homes.error || !selected || !date || !time || !ready || joined?.signature === `${date}:${time}:${homeId}`}
          success={waitlist ? "You are on the waitlist. Watch for an offer before claiming a booking." : "Your booking request has been submitted."}
          onSubmit={async values => {
            if (homes.loading || homes.error) throw new Error("Refresh your homes before submitting.");
            if (!selected) throw new Error("Choose an active home.");
            if (!ready) throw new Error("Refresh appointment times and select an available time.");
            validateAppointment(values.bookingDate, values.startTime, emergency ? 0 : 24);
            if (waitlist) return post("/waitlist", {serviceId:service.id,homeId:+values.homeId,date:values.bookingDate,start:values.startTime});
            return bookingApi.create({...values,homeId:+values.homeId,serviceId:service.id,note:values.note.trim()});
          }} onSuccess={result => waitlist ? setJoined({...result,signature:`${date}:${time}:${homeId}`}) : navigate(`/bookings/${result.id}`, {state:{created:true}})}>
          <Field name="homeId" label="Where should we visit?" value={homeId} onChange={event => setHomeId(event.target.value)} required options={[{value:"",label:"Select your home"},...active.map(home => ({value:home.id,label:`${home.name} · ${home.city}`}))]} />
          {selected && <div className="address-preview"><strong>{selected.name}</strong><p>{selected.address}</p><small>{selected.city}, Bahrain</small></div>}
          <p className="field-hint"><Link to="/homes" state={{returnTo:`/services/${service.id}`}}>Add or update a home</Link><button className="quiet" type="button" onClick={homes.reload}>Refresh homes</button></p>
          {!waitlist && <Field name="bookingType" label="Booking type" value={type} onChange={event => {setType(event.target.value);setTime("");}} options={[{value:"NORMAL",label:"Normal · at least 24 hours' notice"},...(service.emergencyEligible ? [{value:"EMERGENCY",label:"Emergency · 20% surcharge"}] : [])]} />}
          <Notice>{emergency ? "Emergency requests may be made for a future time without the normal 24-hour notice. A 20% surcharge applies; acceptance and availability are still required." : "Normal bookings and waitlists require at least 24 hours' notice. All appointment times use Bahrain local time (UTC+3)."}</Notice>
          <div className="form-columns">
            <Field name="bookingDate" label="Appointment date" type="date" min={today()} required value={date} onChange={event => {setDate(event.target.value);setTime("");}} />
            {waitlist ? <Field name="startTime" label="Requested time (Bahrain)" type="time" required value={time} onChange={event => setTime(event.target.value)} /> : <Field name="startTime" label="Available time (Bahrain)" required value={time} onChange={event => setTime(event.target.value)} disabled={!date || slots.loading || !!slots.error} options={[{value:"",label:!date ? "Choose a date first" : slots.loading ? "Loading times..." : "Select a time"},...times.map(value => ({value,label:formatTime(value)}))]} />}
          </div>
          {!waitlist && <>
            <Notice kind="error">{slots.error}</Notice>
            {date && !slots.loading && !slots.error && !times.length && <Notice>No times are available for this date and booking type. Try another date. A waitlist can only be joined for an occupied appointment within working hours.</Notice>}
            <button type="button" disabled={!date || slots.loading} onClick={slots.reload}>Refresh appointment times</button>
            <Field name="note" maxLength={255} label="Notes for the provider (optional)" type="textarea" hint="Share any access instructions or details about the work." />
          </>}
          <div className="booking-summary">
            <h3>{waitlist ? "Waitlist summary" : "Your booking request"}</h3>
            <p><strong>{service.name}</strong><br />{service.providerName} · {service.durationMinutes} minutes</p>
            <p>{selected ? `${selected.name} · ${selected.city}` : "Select a home"}<br />{date && time ? formatAppointment(date,time) : "Select a date and time"}</p>
            <dl><dt>Standard service</dt><dd>{price(base)}</dd>{emergency && <><dt>Emergency surcharge (20%)</dt><dd>{price(base == null ? null : base * .2)}</dd></>}<dt>Estimated total</dt><dd><strong>{price(base == null ? null : base * (emergency ? 1.2 : 1))}</strong></dd></dl>
            <p className="field-hint">{waitlist ? "An offer is not a booking. Claim a valid offer to submit a normal booking request." : "Submitting sends a request to the provider. Availability and final price are rechecked by HomeHub."}</p>
          </div>
        </ActionForm>
      </> : <Empty>Add an active home before requesting a service. <Link to="/homes" state={{returnTo:`/services/${service.id}`}}>Add your first home</Link>.</Empty>;
    }}</Resource>
    {!waitlist && <details className="waitlist-disclosure"><summary>Need an occupied appointment? Join a waitlist</summary><BookingForm key={`waitlist-${service.id}`} service={service} waitlist /></details>}
  </section>;
}
