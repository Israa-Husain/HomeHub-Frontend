import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { allPages, get, post, put, remove } from "../api";
import { useResource } from "../hooks/useResource";
import { ActionForm, ActionButton, Field, Resource, Empty, Notice, Status } from "../components/Common";
export default function Homes() {
  const homes = useResource(() => allPages("/homes"));
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const editor = useRef(null);
  const location = useLocation();
  const candidate = location.state?.returnTo;
  const returnTo = typeof candidate === "string" && /^\/services\/\d+$/.test(candidate) ? candidate : null;
  const focusEditor = () => requestAnimationFrame(() => { editor.current?.scrollIntoView({block:"start"}); editor.current?.focus(); });
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Your service addresses</p><h1>My homes</h1><p className="muted">Keep your Bahrain addresses ready for your next appointment.</p></div><div className="inline-links"><button className="primary" onClick={() => {setEditing(null);setRevision(value => value + 1);focusEditor();}}>Add a home</button>{returnTo && <Link className="button" to={returnTo}>Return to service</Link>}</div></div>
    <Notice kind="success">{message}</Notice>
    <div className="home-management">
      <section><h2>Saved homes</h2><Resource resource={homes}>{rows => rows.length ? <div className="home-list">{rows.map(home => <article className="card" key={home.id}>
        <div className="card-footer"><h3>{home.name}</h3><Status value={home.active ? "ACTIVE" : "INACTIVE"} /></div>
        <p className="preserve-lines">{home.address}</p><p className="muted">{home.city}, Bahrain</p>
        <div className="inline-links"><ActionButton action={() => get(`/homes/${home.id}`)} onSuccess={result => {setEditing(result);setMessage("");focusEditor();}}>Edit home</ActionButton>
          {home.active && <ActionButton className="danger" action={() => remove(`/homes/${home.id}`)} onSuccess={() => {if(editing?.id === home.id) setEditing(null);setMessage(`${home.name} has been removed from future booking choices.`);homes.reload();}} confirm={`Remove ${home.name} from your homes? This deactivates the address for new bookings.`}>Remove home</ActionButton>}
          {returnTo && home.active && <Link className="button" to={`${returnTo}?homeId=${home.id}`}>Use this home</Link>}
        </div>
      </article>)}</div> : <Empty>No saved homes yet. Add your first address using the form.</Empty>}</Resource></section>
      <section className="card home-editor"><h2 tabIndex={-1} ref={editor}>{editing ? `Edit ${editing.name}` : "Add a home"}</h2><p className="field-hint">HomeHub serves Bahrain. Include the building, road, block and any useful access details in your address.</p>
        <ActionForm key={`${editing?.id || "new"}-${revision}`} submit={editing ? "Save home" : "Add home"} pending="Saving home..." success="" onSubmit={values => {
          const body = Object.fromEntries(Object.entries(values).map(([key,value]) => [key,value.trim()]));
          if(Object.values(body).some(value => !value)) throw new Error("Enter a home name, city and complete address.");
          return editing ? put(`/homes/${editing.id}`,body) : post("/homes",body);
        }} onSuccess={result => {setMessage(`${result.name} has been ${editing ? "updated" : "added"}.`);setEditing(null);setRevision(value => value + 1);homes.reload();}}>
          <Field name="name" maxLength={255} label="Home name" placeholder="e.g. Family home" required defaultValue={editing?.name || ""} />
          <Field name="city" maxLength={255} label="City or area in Bahrain" autoComplete="address-level2" required defaultValue={editing?.city || ""} />
          <Field name="address" maxLength={255} label="Full address" type="textarea" autoComplete="street-address" hint="Include building, road and block numbers." required defaultValue={editing?.address || ""} />
        </ActionForm>
        {editing && <button className="quiet" onClick={() => {setEditing(null);setMessage("");}}>Cancel editing</button>}
        <p className="field-hint">Removing a home deactivates it for future bookings. Existing booking records are retained.</p>
      </section>
    </div>
  </>;
}
