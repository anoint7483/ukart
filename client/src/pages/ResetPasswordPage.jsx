import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/auth.css";

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-alert auth-alert--error">Invalid or missing reset token.</div>
          <p className="auth-switch"><Link to="/forgot-password" className="auth-link">Request a new link</Link></p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirm) return setError("Passwords do not match");

    setSubmitting(true);
    const result = await resetPassword(token, form.password);
    setSubmitting(false);

    if (result.success) {
      navigate("/login", { state: { message: result.message } });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link to="/" className="auth-logo">u<span>Kart</span></Link>
      </div>

      <div className="auth-card">
        <div className="auth-icon">🔒</div>
        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Choose a strong password for your account.</p>

        {error && <div className="auth-alert auth-alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="password">New Password</label>
            <div className="auth-input-wrap">
              <input id="password" name="password" type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters" value={form.password}
                onChange={(e) => { setError(""); setForm((p) => ({ ...p, password: e.target.value })); }}
                required />
              <button type="button" className="auth-eye" onClick={() => setShowPass((p) => !p)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">Confirm Password</label>
            <input id="confirm" name="confirm" type={showPass ? "text" : "password"}
              placeholder="Repeat new password" value={form.confirm}
              onChange={(e) => { setError(""); setForm((p) => ({ ...p, confirm: e.target.value })); }}
              required />
          </div>

          <button className="auth-btn" type="submit" disabled={submitting}>
            {submitting ? <span className="auth-spinner" /> : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
