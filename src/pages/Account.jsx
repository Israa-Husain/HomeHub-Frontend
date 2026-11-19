import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import { imageUrl } from "../api/client";
import { Link } from "react-router-dom";
import { ActionForm, Field, Status } from "../components/Common";
export default function Account() {
  const { user, refresh } = useAuth();
  return (
    <>
      <div className="dashboard-heading"><div><p className="eyebrow">Your HomeHub account</p><h1>Account settings</h1><p className="muted">Manage your personal details, profile picture and password.</p></div><Link className="button" to="/notifications">View notifications</Link></div>
      <div className="account-layout"><div>
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
          submit="Save profile" pending="Saving profile..." success="Your profile details have been updated."
          onSubmit={(values) => {
            const body = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
            if (!body.firstName || !body.lastName) throw new Error("Enter your first and last name.");
            return authApi.updateProfile(body);
          }}
          onSuccess={refresh}
        >
          <Field
            name="firstName" maxLength={255}
            label="First name" autoComplete="given-name"
            defaultValue={user.firstName}
            required
          />
          <Field
            name="lastName" maxLength={255}
            label="Last name" autoComplete="family-name"
            defaultValue={user.lastName}
            required
          />
          <Field
            name="phoneNumber" maxLength={255}
            label="Phone number" autoComplete="tel" hint="Include your Bahrain country code (+973)."
            type="tel"
            defaultValue={user.phoneNumber || ""}
          />
        </ActionForm>
      </section>
      <section className="card">
        <h2>Profile picture</h2>
        <p>JPG, PNG, or WEBP. Maximum 5 MB.</p>
        <ActionForm
          submit="Upload picture" pending="Uploading picture..." success="Your profile picture has been updated."
          onSubmit={async (_, form) => {
            const file = new FormData(form).get("file");
            if (!file?.size || file.size > 5000000)
              throw new Error("Choose an image up to 5 MB.");
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
              throw new Error("Choose a JPG, PNG or WEBP image.");
            const body = new FormData();
            body.append("file", file);
            return authApi.uploadProfilePicture(body);
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
      </div><div><section className="card">
        <h2>Change password</h2>
        <p className="muted">Enter your current password, then choose and confirm a new one.</p>
        <ActionForm
          submit="Change password" pending="Changing password..."
          onSubmit={async ({ confirmPassword, ...values }, form) => {
            if (values.newPassword !== confirmPassword) throw new Error("The new passwords do not match.");
            await authApi.changePassword(values);
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
            minLength="8" hint="Use at least 8 characters."
            autoComplete="new-password"
            required
          />
          <Field name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" minLength={8} required />
        </ActionForm>
      </section></div></div>
    </>
  );
}
