import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import { ActionForm, Field, Notice } from "../components/Common";
const copy = {
  login: ["Welcome back", "Sign in to HomeHub", "Access your bookings, services and account in one place.", "Sign in", "Signing in..."],
  register: ["Join HomeHub", "Create your account", "Find help for your home or offer your services across Bahrain.", "Create account", "Creating account..."],
  verify: ["One more step", "Verify your email", "Open the verification link in your welcome email. If you have a token instead, paste it below. Verification links expire after 24 hours.", "Verify email", "Verifying email..."],
  forgot: ["Account recovery", "Forgot your password?", "Enter your account email to request a password reset token. Check your inbox and spam folder, then open the reset password page.", "Send reset instructions", "Requesting reset..."],
  reset: ["Account recovery", "Choose a new password", "Paste the reset token from your email and choose a password of at least 8 characters. Reset tokens expire after 30 minutes; request a new one if yours has expired.", "Reset password", "Resetting password..."],
};
export default function Auth({ mode }) {
  const { login, sessionError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [completed, setCompleted] = useState("");
  const done = completed === mode;
  const successPanel = useRef(null);
  const token = params.get("token") || "";
  useEffect(() => setCompleted(""), [mode, token]);
  useEffect(() => { if (done) successPanel.current?.focus(); }, [done]);
  const [eyebrow, title, description, submit, pending] = copy[mode];
  const handle = async ({ confirmPassword, ...values }, form) => {
    if (["register", "reset"].includes(mode) && confirmPassword !== (values.password ?? values.newPassword)) {
      form.elements.confirmPassword.focus();
      throw new Error("The passwords do not match. Please enter the same password in both fields.");
    }
    for (const field of ["firstname", "lastName", "email", "phoneNumber", "token"]) {
      if (field in values) {
        values[field] = values[field].trim();
        if (!values[field]) throw new Error("Please complete all required fields.");
      }
    }
    if (mode === "login") {
      await login(values);
      const from = location.state?.from;
      navigate(typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard", { replace: true });
    }
    if (mode === "register") return authApi.register(values);
    if (mode === "verify") return authApi.verify(values.token);
    if (mode === "forgot") return authApi.forgot(values);
    if (mode === "reset") return authApi.reset(values);
  };
  const messages = {
    register: "Account created. Check your inbox and spam folder for the verification email before signing in. Email delivery may take a moment.",
    verify: "Your email is verified. You can now sign in.",
    forgot: "If an account matches this email, reset instructions have been requested. Check your inbox and spam folder; this message does not confirm delivery.",
    reset: "Your password has been reset. Sign in with your new password.",
  };
  return <section className={`auth-panel card${mode === "login" ? " auth-login" : ""}`}>
    {mode !== "login" && <div className="auth-icon" aria-hidden="true"><ShieldCheck size={25} /></div>}
    <p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p>
    {mode === "login" && <Notice>{sessionError}</Notice>}
    {done && mode !== "forgot" ? <div ref={successPanel} tabIndex={-1} className="form-feedback"><Notice kind="success">{messages[mode]}</Notice></div> : <ActionForm
      key={`${mode}-${params.get("token") || ""}`} onSubmit={handle} submit={submit} pending={pending}
      success={messages[mode] || ""} onSuccess={() => { if (mode !== "login") setCompleted(mode); }}>
      {mode === "register" && <>
        <div className="form-columns"><Field name="firstname" maxLength={255} label="First name" autoComplete="given-name" required /><Field name="lastName" maxLength={255} label="Last name" autoComplete="family-name" required /></div>
        <Field name="phoneNumber" maxLength={255} label="Phone number" type="tel" autoComplete="tel" hint="Include your Bahrain country code (+973)." required />
        <Field name="role" label="Account type" hint="Providers complete a business profile and require approval before offering services." options={[{value:"HOMEOWNER",label:"Homeowner"},{value:"PROVIDER",label:"Service provider"}]} />
      </>}
      {["login","register","forgot"].includes(mode) && <Field name="email" maxLength={255} label="Email address" type="email" autoComplete={mode === "login" ? "username" : "email"} autoCapitalize="none" spellCheck={false} required />}
      {["login","register"].includes(mode) && <Field name="password" label="Password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} hint={mode === "register" ? "Use at least 8 characters." : undefined} required />}
      {["verify","reset"].includes(mode) && <Field name="token" label={mode === "verify" ? "Verification token" : "Password reset token"} defaultValue={params.get("token") || ""} autoComplete="off" autoCapitalize="none" spellCheck={false} hint="Copy only the token from your email, without extra spaces." required />}
      {mode === "reset" && <Field name="newPassword" label="New password" type="password" autoComplete="new-password" minLength={8} hint="Use at least 8 characters." required />}
      {["register","reset"].includes(mode) && <Field name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" minLength={8} required />}
    </ActionForm>}
    <nav className="auth-links" aria-label="Account help">
      {mode !== "login" && <Link to="/login">Back to sign in</Link>}
      {mode === "login" && <><Link to="/forgot-password">Forgot password?</Link><Link to="/register">Create an account</Link><Link to="/verify">Verify your email</Link></>}
      {mode === "register" && <Link to="/verify">Have a verification token?</Link>}
      {mode === "forgot" && <Link className={done ? "button primary" : ""} to="/reset-password">Enter reset token</Link>}
      {mode === "reset" && <Link to="/forgot-password">Request a new reset token</Link>}
    </nav>
    {mode === "verify" && <p className="field-hint">If the verification link is expired or missing, contact HomeHub support for help. A replacement cannot be requested from this page.</p>}
  </section>;
}
