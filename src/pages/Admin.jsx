import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useSearchParams } from "react-router-dom";
import { allPages, authApi, get, post, put, remove } from "../api";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import { Resource, ActionButton, ActionForm, Field, Status, Empty, Pagination, Notice } from "../components/Common";
import { formatDateTime, label } from "../utils/booking";

function AdminNavigation() {
  return <nav className="admin-navigation" aria-label="Administration navigation">
    <NavLink end to="/dashboard">Admin overview</NavLink><NavLink to="/admin/providers">Provider applications</NavLink><NavLink to="/admin/users">Users</NavLink><NavLink to="/admin/categories">Categories</NavLink>
  </nav>;
}
export function AdminOverview() {
  const users = useResource(() => authApi.users({page:0,size:1}));
  const providers = useResource(() => get("/admin/providers",{page:0,size:1}));
  const pending = useResource(() => get("/admin/providers",{status:"PENDING",page:0,size:1,sort:"createdAt,asc"}));
  const categories = useResource(() => get("/categories",{page:0,size:1}));
  const refresh = () => {users.reload();providers.reload();pending.reload();categories.reload();};
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">HomeHub administration</p><h1>Platform overview</h1><p className="muted">Review applications, manage account access and maintain service categories.</p></div><button onClick={refresh} disabled={[users,providers,pending,categories].some(resource => resource.loading)}>Refresh overview</button></div>
    <AdminNavigation />
    <div className="admin-stats-grid">
      {[{title:"Registered users",resource:users,to:"/admin/users",action:"View users"},{title:"Provider profiles",resource:providers,to:"/admin/providers?status=all",action:"View all provider applications"},{title:"Pending applications",resource:pending,to:"/admin/providers?status=PENDING",action:"Review applications"},{title:"Active categories",resource:categories,to:"/admin/categories",action:"Manage categories"}].map(({title,resource,to,action}) => <section className="card admin-stat" key={title}><h2>{title}</h2><Resource resource={resource}>{result => <strong className="admin-stat-value">{result.totalElements}</strong>}</Resource><Link to={to}>{action}</Link></section>)}
    </div>
    <section className="card admin-priority"><p className="eyebrow">Application review</p><h2>Review before granting provider access</h2><p>Inspect the business description, portfolio and applicant account before approving a pending application.</p><Resource resource={pending}>{result => <p>{result.totalElements ? `${result.totalElements} applications are awaiting review.` : "There are no pending provider applications."}</p>}</Resource><Link className="button primary" to="/admin/providers?status=PENDING">Open pending applications</Link></section>
    <div className="grid"><section className="card"><h2>Manage account access</h2><p>Inspect roles, verification and account status before deactivating a user.</p><Link className="button" to="/admin/users">Manage users</Link></section><section className="card"><h2>Maintain service categories</h2><p>Add clear category names and descriptions. Deactivating a category removes it from discovery and prevents new eligible bookings under it.</p><Link className="button" to="/admin/categories">Manage categories</Link></section></div>
    <div className="inline-links"><Link to="/bookings">Inspect a booking by ID</Link><Link to="/services">Browse services</Link><Link to="/notifications">View notifications</Link></div>
  </>;
}

export function AdminUsers() {
  const { user } = useAuth();
  const [page,setPage] = useState(0);
  const [message,setMessage] = useState("");
  const users = useResource(() => authApi.users({page,size:20,sort:"id,asc"}),[page]);
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Account administration</p><h1>Platform users</h1><p className="muted">Review account details, roles and verification before changing access.</p></div><button disabled={users.loading} onClick={users.reload}>Refresh users</button></div><AdminNavigation />
    <Notice kind="success">{message}</Notice><Notice>Deactivation removes access to HomeHub. User records are retained, and reactivation is not available here.</Notice>
    <Resource resource={users}>{result => <>
      <p className="results-count">{result.totalElements} registered users · {result.content.length} on this page</p>
      {!result.content.length ? <Empty>No users on this page.{page > 0 && <button onClick={() => setPage(0)}>Return to first page</button>}</Empty> : <div className="table-wrap"><table className="admin-user-table"><caption>HomeHub accounts. Expand a name to view verification, contact details and Bahrain timestamps.</caption><thead><tr><th scope="col">User</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Account status</th><th scope="col">Action</th></tr></thead><tbody>{result.content.map(row => <tr key={row.id}>
        <td><details><summary>{row.firstName} {row.lastName} <small>#{row.id}</small></summary><dl className="admin-user-details"><dt>Phone</dt><dd>{row.phoneNumber || "Not provided"}</dd><dt>Email verified</dt><dd>{row.isEmailVerified ? "Yes" : "No"}</dd><dt>Joined</dt><dd>{formatDateTime(row.createdAt)}</dd><dt>Updated</dt><dd>{formatDateTime(row.updatedAt)}</dd></dl></details></td>
        <td>{row.email}</td><td><span className="role-label">{label(row.role)}</span></td><td><Status value={row.status} /></td>
        <td>{String(row.id) === String(user.id) ? <span className="field-hint">Your account</span> : row.status === "ACTIVE" ? <ActionButton className="danger" action={() => authApi.deactivateUser(row.id)} onSuccess={() => {setMessage(`${row.firstName} ${row.lastName} (${row.email}) has been deactivated.`);users.reload();}} confirm={`Deactivate ${row.firstName} ${row.lastName} (${row.email}), user #${row.id}? They will lose access to HomeHub. This does not delete their records. Reactivation is not available here.`}>Deactivate account</ActionButton> : <span className="field-hint">No action available</span>}</td>
      </tr>)}</tbody></table></div>}
      <Pagination result={result} page={page} setPage={setPage} />
    </>}</Resource>
  </>;
}

export function AdminProviders() {
  const [page,setPage] = useState(0);
  const [params] = useSearchParams();
  const [status,setStatus] = useState(() => params.get("status") === "all" ? "" : ["PENDING","APPROVED","SUSPENDED"].includes(params.get("status")) ? params.get("status") : "PENDING");
  const [selectedId,setSelectedId] = useState(null);
  const [message,setMessage] = useState("");
  const detailHeading = useRef(null);
  const applications = useResource(() => get("/admin/providers",{status:status || undefined,page,size:12,sort:"createdAt,asc"}),[status,page]);
  const details = useResource(() => selectedId ? get(`/admin/providers/${selectedId}`) : null,[selectedId]);
  const currentDetails = selectedId && (!details.data || String(details.data.provider.id) !== String(selectedId)) ? {...details,data:null,loading:!details.error} : details;
  useEffect(() => {
    if(selectedId && details.data && String(details.data.provider.id) === String(selectedId) && !details.loading) {
      detailHeading.current?.scrollIntoView({block:"start"});detailHeading.current?.focus();
    }
  },[selectedId,details.data,details.loading]);
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Provider access</p><h1>Provider applications</h1><p className="muted">Review business and applicant details before approving a provider.</p></div><button disabled={applications.loading} onClick={() => {applications.reload();if(selectedId)details.reload();}}>Refresh applications</button></div><AdminNavigation />
    <Notice kind="success">{message}</Notice>
    <div className="admin-filter-bar"><Field name="status" label="Approval status" value={status} onChange={event => {setStatus(event.target.value);setPage(0);setSelectedId(null);}} options={[{value:"",label:"All applications"},...["PENDING","APPROVED","SUSPENDED"].map(value => ({value,label:label(value)}))]} /><p className="field-hint">Only pending applications offer approval here. Approved and suspended profiles remain available for inspection.</p></div>
    <Resource resource={applications}>{result => <>
      <p className="results-count">{result.totalElements} {status ? label(status) : "total"} applications · oldest first</p>
      {result.content.length ? <div className="grid">{result.content.map(row => <article className="card application-card" key={row.provider.id}><div className="card-footer"><Status value={row.provider.providerStatus} /><small>Profile #{row.provider.id}</small></div><h2>{row.provider.businessName}</h2><p>{row.applicant.firstName} {row.applicant.lastName}</p><p className="muted">{row.applicant.email}</p><p className="field-hint">Applied: {formatDateTime(row.createdAt)}</p><button className={String(selectedId) === String(row.provider.id) ? "primary" : ""} aria-pressed={String(selectedId) === String(row.provider.id)} onClick={() => setSelectedId(row.provider.id)}>Review application</button></article>)}</div> : <Empty>No applications match this status.{page > 0 && <button onClick={() => setPage(0)}>Return to first page</button>}</Empty>}
      <Pagination result={result} page={page} setPage={value => {setPage(value);setSelectedId(null);}} />
    </>}</Resource>
    {selectedId && <section className="card application-detail" aria-label="Selected application"><div className="card-footer"><h2 tabIndex={-1} ref={detailHeading}>Application #{selectedId}</h2><button onClick={() => setSelectedId(null)}>Close application</button></div><Resource resource={currentDetails}>{selected => <>
      <div className="card-footer"><h3>{selected.provider.businessName}</h3><Status value={selected.provider.providerStatus} /></div><div className="admin-detail-columns"><div><h3>Business description</h3><p className="preserve-lines">{selected.provider.description || "No business description provided."}</p><h3>Portfolio</h3><p className="preserve-lines">{selected.provider.portfolioDescription || "No portfolio description provided."}</p><p>Emergency preference: {selected.provider.emergencyEnabled ? "Opted in" : "Not enabled"}</p></div><div><h3>Applicant account</h3><dl><dt>Name</dt><dd>{selected.applicant.firstName} {selected.applicant.lastName}</dd><dt>Email</dt><dd>{selected.applicant.email}</dd><dt>Phone</dt><dd>{selected.applicant.phoneNumber || "Not provided"}</dd><dt>Role</dt><dd className="role-label">{label(selected.applicant.role)}</dd><dt>Account status</dt><dd><Status value={selected.applicant.status} /></dd><dt>Email verified</dt><dd>{selected.applicant.isEmailVerified ? "Yes" : "No"}</dd><dt>Applied</dt><dd>{formatDateTime(selected.createdAt)}</dd><dt>Updated</dt><dd>{formatDateTime(selected.updatedAt)}</dd></dl></div></div>
      {(selected.applicant.status !== "ACTIVE" || !selected.applicant.isEmailVerified) && <Notice>The applicant account is {label(selected.applicant.status)} and its email is {selected.applicant.isEmailVerified ? "verified" : "not verified"}. Provider approval does not activate the account or verify its email.</Notice>}
      {selected.provider.providerStatus === "PENDING" ? <div className="approval-panel"><h3>Approve this business</h3><p>Approval allows this provider to create services. Marketplace eligibility still requires an active account and active services and categories.</p><ActionButton className="primary" action={() => put(`/admin/providers/${selected.provider.id}/approve`)} confirm={`Approve ${selected.provider.businessName}, provider profile #${selected.provider.id}, submitted by ${selected.applicant.email}? This grants provider approval and allows service creation; it does not change account or email-verification status.`} onSuccess={() => {setMessage(`${selected.provider.businessName} (profile #${selected.provider.id}) has been approved.`);setSelectedId(null);applications.reload();}}>Approve provider</ActionButton></div> : <Notice>{selected.provider.providerStatus === "APPROVED" ? "This provider is already approved." : "This provider is suspended. No status-change action is offered here."}</Notice>}
    </>}</Resource></section>}
    <p className="field-hint">Applications can be reviewed and pending providers approved. Provider rejection is not available here.</p>
  </>;
}

export function AdminCategories() {
  const categories = useResource(() => allPages("/categories",{sort:"name,asc"}));
  const [editing,setEditing] = useState(null);
  const [message,setMessage] = useState("");
  const [formVersion,setFormVersion] = useState(0);
  const [page,setPage] = useState(0);
  const editor = useRef(null);
  const focusEditor = () => requestAnimationFrame(() => {editor.current?.scrollIntoView({block:"start"});editor.current?.focus();});
  return <>
    <div className="dashboard-heading"><div><p className="eyebrow">Service organization</p><h1>Service categories</h1><p className="muted">Keep active categories clear and useful for homeowners and providers.</p></div><div className="inline-links"><button disabled={categories.loading} onClick={categories.reload}>Refresh categories</button><button className="primary" onClick={() => {setEditing(null);setFormVersion(value => value+1);focusEditor();}}>Add category</button></div></div><AdminNavigation />
    <Notice kind="success">{message}</Notice><Notice>This directory shows active categories only. Deactivation removes a category from discovery and prevents new eligible bookings under it; existing records are retained. Category reactivation is not available here.</Notice>
    <div className="admin-category-layout"><section><h2>Active categories</h2><Resource resource={categories}>{rows => {
      const totalPages = Math.ceil(rows.length/12);
      const current = Math.min(page,Math.max(0,totalPages-1));
      return <><p className="results-count">{rows.length} active categories</p>{rows.length ? <div className="category-list">{rows.slice(current*12,current*12+12).map(row => <article className="card" key={row.id}><div className="card-footer"><h3>{row.name}</h3><Status value={row.status} /></div><p className="preserve-lines">{row.description || "No description provided."}</p><div className="inline-links"><ActionButton action={() => get(`/categories/${row.id}`)} onSuccess={result => {setEditing(result);focusEditor();}}>View / edit category</ActionButton>{row.status === "ACTIVE" && <ActionButton className="danger" action={() => remove(`/categories/${row.id}`)} confirm={`Deactivate ${row.name}, category #${row.id}? Services under this category will no longer be eligible for discovery or new bookings. Existing records are retained. Reactivation is not available here.`} onSuccess={() => {setMessage(`${row.name} has been deactivated and removed from the active directory.`);if(editing?.id === row.id)setEditing(null);categories.reload();}}>Deactivate</ActionButton>}</div></article>)}</div> : <Empty>No active categories. Add one using the category form.</Empty>}<Pagination result={{totalPages}} page={current} setPage={setPage} /></>;
    }}</Resource></section>
    <section className="card category-editor"><h2 ref={editor} tabIndex={-1}>{editing ? `Edit ${editing.name}` : "Add category"}</h2><p className="field-hint">Use a recognizable name and a short description of the services it covers.</p>{editing && <Status value={editing.status} />}
      <ActionForm key={`${editing?.id || "new"}-${formVersion}`} submit={editing ? "Save category" : "Create category"} pending="Saving category..." success="" onSubmit={values => {
        const body = {name:values.name.trim(),description:values.description.trim()};
        if(!body.name) throw new Error("Enter a category name.");
        return editing ? put(`/categories/${editing.id}`,body) : post("/categories",body);
      }} onSuccess={result => {setMessage(`${result.name} has been ${editing ? "updated" : "created"}.`);setEditing(null);setFormVersion(value => value+1);categories.reload();}}>
        <Field name="name" maxLength={255} label="Category name" required defaultValue={editing?.name || ""} /><Field name="description" maxLength={255} label="Description (optional)" type="textarea" defaultValue={editing?.description || ""} />
      </ActionForm>{editing && <button className="quiet" onClick={() => setEditing(null)}>Cancel editing</button>}
    </section></div>
  </>;
}
