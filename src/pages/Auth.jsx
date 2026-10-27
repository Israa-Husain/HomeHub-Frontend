import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import { ActionForm, Field, Notice } from "../components/Common";
export default function Auth({ mode }) {
  const { login, sessionError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const titles = {
    login: "Sign in to HomeHub",
    register: "Create your account",
    verify: "Verify your email",
    forgot: "Forgot your password?",
    reset: "Reset your password",
  };
  const handle = async (values) => {
    if (mode === "login") {
      await login(values);
      navigate(location.state?.from || "/dashboard", { replace: true });
    }
    if (mode === "register") return authApi.register(values);
    if (mode === "verify") return authApi.verify(values.token);
    if (mode === "forgot") return authApi.forgot(values);
    if (mode === "reset") return authApi.reset(values);
  };
  const messages = {
    register:
      "Your account has been created. Check your email for the verification link. Email delivery may take a moment.",
    verify: "Email verified. You can now sign in.",
    forgot:
      "If this account exists, a reset email has been requested. Check your inbox.",
    reset: "Your password has been reset. You can now sign in.",
  };
  return (
    <section className="auth-panel card">
      <h1>{titles[mode]}</h1>
      {mode === "login" && <Notice>{sessionError}</Notice>}
      <ActionForm
        key={mode}
        onSubmit={handle}
        submit={
          mode === "login"
            ? "Sign in"
            : mode === "register"
              ? "Create account"
              : mode === "verify"
                ? "Verify email"
                : "Submit"
        }
        success={messages[mode] || ""}
      >
        {mode === "register" && (
          <>
            <Field
              name="firstname"
              label="First name"
              autoComplete="given-name"
              required
            />
            <Field
              name="lastName"
              label="Last name"
              autoComplete="family-name"
              required
            />
            <Field
              name="phoneNumber"
              label="Phone number"
              type="tel"
              autoComplete="tel"
              required
            />
            <Field
              name="role"
              label="Account type"
              options={[
                { value: "HOMEOWNER", label: "Homeowner" },
                { value: "PROVIDER", label: "Service provider" },
              ]}
            />
          </>
        )}
        {["login", "register", "forgot"].includes(mode) && (
          <Field
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
          />
        )}
        {["login", "register"].includes(mode) && (
          <Field
            name="password"
            label="Password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={mode === "register" ? 8 : undefined}
            required
          />
        )}
        {["verify", "reset"].includes(mode) && (
          <Field
            name="token"
            label="Token from your email"
            defaultValue={params.get("token") || ""}
            required
          />
        )}
        {mode === "reset" && (
          <Field
            name="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength="8"
            required
          />
        )}
      </ActionForm>
      <div className="inline-links">
        <Link to="/login">Sign in</Link>
        <Link to="/register">Register</Link>
        <Link to="/forgot-password">Forgot password</Link>
        <Link to="/verify">Verify email</Link>
        {mode === "forgot" && <Link to="/reset-password">Use reset token</Link>}
      </div>
    </section>
  );
}
