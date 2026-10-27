import { useAuth } from "../context/AuthContext";
import { post, put } from "../api";
import { imageUrl } from "../api/client";
import { ActionForm, Field, Status } from "../components/Common";
export default function Account() {
  const { user, refresh } = useAuth();
  return (
    <>
      <h1>Account settings</h1>
      <section className="card">
        <p>
          {user.email} · {user.role.toLowerCase()} ·{" "}
          <Status value={user.status} />
        </p>
        {user.profilePictureUrl && (
          <img
            className="avatar"
            src={imageUrl(user.profilePictureUrl)}
            alt="Your profile"
          />
        )}
        <h2>Profile details</h2>
        <ActionForm
          onSubmit={(values) => put("/users/profile", values)}
          onSuccess={refresh}
        >
          <Field
            name="firstName"
            label="First name"
            defaultValue={user.firstName}
            required
          />
          <Field
            name="lastName"
            label="Last name"
            defaultValue={user.lastName}
            required
          />
          <Field
            name="phoneNumber"
            label="Phone number"
            type="tel"
            defaultValue={user.phoneNumber || ""}
          />
        </ActionForm>
      </section>
      <section className="card">
        <h2>Profile picture</h2>
        <p>JPG, PNG, or WEBP. Maximum 5 MB.</p>
        <ActionForm
          submit="Upload picture"
          onSubmit={async (_, form) => {
            const file = new FormData(form).get("file");
            if (!file?.size || file.size > 5000000)
              throw new Error("Choose an image up to 5 MB.");
            const body = new FormData();
            body.append("file", file);
            return post("/users/profile-picture", body);
          }}
          onSuccess={refresh}
        >
          <Field
            name="file"
            label="Image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </ActionForm>
      </section>
      <section className="card">
        <h2>Change password</h2>
        <ActionForm
          submit="Change password"
          onSubmit={async (values, form) => {
            await put("/users/change-password", values);
            form.reset();
          }}
          success="Your password has been changed."
        >
          <Field
            name="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Field
            name="newPassword"
            label="New password"
            type="password"
            minLength="8"
            autoComplete="new-password"
            required
          />
        </ActionForm>
      </section>
    </>
  );
}
