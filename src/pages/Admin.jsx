import { useState } from "react";
import { allPages, get, post, put, remove } from "../api";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import {
  Resource,
  ActionButton,
  ActionForm,
  Field,
  Status,
  Notice,
  Empty,
} from "../components/Common";
export function AdminUsers() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const users = useResource(
    () => get("/admin/users", { page, size: 20, sort: "id,asc" }),
    [page],
  );
  return (
    <>
      <h1>Platform users</h1>
      <Resource resource={users}>
        {(result) => (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.content.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <details>
                          <summary>
                            {row.firstName} {row.lastName} (#{row.id})
                          </summary>
                          <p>Phone: {row.phoneNumber || "Not provided"}</p>
                          <p>
                            Email verified: {row.isEmailVerified ? "Yes" : "No"}
                          </p>
                          <p>Joined: {row.createdAt?.replace("T", " ")}</p>
                        </details>
                      </td>
                      <td>{row.email}</td>
                      <td>{row.role}</td>
                      <td>
                        <Status value={row.status} />
                      </td>
                      <td>
                        {row.status === "ACTIVE" && row.id !== user.id && (
                          <ActionButton
                            action={() => remove(`/admin/users/${row.id}`)}
                            onSuccess={users.reload}
                            confirm={`Deactivate ${row.firstName}'s account? They will lose access to HomeHub.`}
                          >
                            Deactivate
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled={!page} onClick={() => setPage(page - 1)}>
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
          </>
        )}
      </Resource>
    </>
  );
}
export function AdminProviders() {
  const [provider, setProvider] = useState(null);
  return (
    <>
      <h1>Provider approval</h1>
      <Notice>
        The backend does not expose a provider application list or provider
        lookup for admins. Obtain the provider profile ID from the applicant's
        business profile page. Approval is the only supported administrative
        provider decision.
      </Notice>
      <section className="card">
        <ActionForm
          submit="Approve provider"
          onSubmit={(values) => {
            if (
              !window.confirm(`Approve provider profile #${values.providerId}?`)
            )
              throw new Error("Approval cancelled.");
            return put(`/admin/providers/${values.providerId}/approve`);
          }}
          onSuccess={setProvider}
        >
          <Field
            name="providerId"
            label="Provider profile ID (not user ID)"
            type="number"
            min="1"
            step="1"
            required
          />
        </ActionForm>
        {provider && (
          <p>
            {provider.businessName} · <Status value={provider.providerStatus} />
          </p>
        )}
      </section>
    </>
  );
}
export function AdminCategories() {
  const categories = useResource(() => allPages("/categories"));
  const [editing, setEditing] = useState(null);
  return (
    <>
      <h1>Service categories</h1>
      <section className="card">
        <h2>{editing ? `Edit ${editing.name}` : "Add category"}</h2>
        <ActionForm
          key={editing?.id || "new"}
          onSubmit={(values) =>
            editing
              ? put(`/categories/${editing.id}`, values)
              : post("/categories", values)
          }
          onSuccess={() => {
            categories.reload();
            setEditing(null);
          }}
        >
          <Field
            name="name"
            label="Category name"
            defaultValue={editing?.name || ""}
            required
          />
          <Field
            name="description"
            label="Description"
            type="textarea"
            defaultValue={editing?.description || ""}
          />
        </ActionForm>
        {editing && (
          <button onClick={() => setEditing(null)}>Cancel editing</button>
        )}
      </section>
      <Resource resource={categories}>
        {(rows) =>
          rows.length ? (
            <div className="grid">
              {rows.map((row) => (
                <article className="card" key={row.id}>
                  <h2>{row.name}</h2>
                  <p>{row.description}</p>
                  <Status value={row.status} />
                  <div className="inline-links">
                    <ActionButton
                      action={() => get(`/categories/${row.id}`)}
                      onSuccess={setEditing}
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      action={() => remove(`/categories/${row.id}`)}
                      onSuccess={categories.reload}
                      confirm={`Deactivate ${row.name}?`}
                    >
                      Deactivate
                    </ActionButton>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty>No active categories.</Empty>
          )
        }
      </Resource>
    </>
  );
}
