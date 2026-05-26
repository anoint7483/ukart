import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import "../styles/auth.css";

const LoginPage = () => {
  const { login, user, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleChange = (e) => {
    setLocalError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(form.email, form.password);
    if (!result.success) setLocalError(result.message);
    setSubmitting(false);
  };

  const displayError = localError || error;

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link to="/" className="auth-logo">u<span>Kart</span></Link>
        <p className="auth-tagline">Your one-stop shop, reimagined.</p>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to continue shopping</p>

        {displayError && <div className="auth-alert auth-alert--error">{displayError}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-header">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="auth-link--small">Forgot password?</Link>
            </div>
            <div className="auth-input-wrap">
              <input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="auth-eye" onClick={() => setShowPass((p) => !p)}
                aria-label="Toggle password visibility">
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button className="auth-btn" type="submit" disabled={submitting || loading}>
            {submitting ? <span className="auth-spinner" /> : "Log In"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <GoogleLoginButton />

        <p className="auth-switch">
          Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
