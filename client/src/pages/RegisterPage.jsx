import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import "../styles/auth.css";

const RegisterPage = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirm) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    setSubmitting(true);
    const result = await register(form.name, form.email, form.password);
    setSubmitting(false);

    if (result.success) {
      setSuccess(result.message);
      setForm({ name: "", email: "", password: "", confirm: "" });
    } else {
      setError(result.message);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][strength];

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link to="/" className="auth-logo">u<span>Kart</span></Link>
        <p className="auth-tagline">Join millions of happy shoppers.</p>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start shopping in seconds</p>

        {error && <div className="auth-alert auth-alert--error">{error}</div>}
        {success && <div className="auth-alert auth-alert--success">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="name">Full Name</label>
              <input id="name" name="name" type="text" placeholder="John Doe"
                value={form.name} onChange={handleChange} required />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="you@example.com"
                autoComplete="email" value={form.email} onChange={handleChange} required />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <input id="password" name="password" type={showPass ? "text" : "password"}
                  placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                <button type="button" className="auth-eye" onClick={() => setShowPass((p) => !p)}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {form.password && (
                <div className="auth-strength">
                  <div className="auth-strength-bar">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="auth-strength-seg"
                        style={{ background: i <= strength ? strengthColor : "#e5e7eb" }} />
                    ))}
                  </div>
                  <span style={{ color: strengthColor, fontSize: 12 }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="confirm">Confirm Password</label>
              <input id="confirm" name="confirm" type={showPass ? "text" : "password"}
                placeholder="Repeat password" value={form.confirm} onChange={handleChange} required />
            </div>

            <button className="auth-btn" type="submit" disabled={submitting}>
              {submitting ? <span className="auth-spinner" /> : "Create Account"}
            </button>
          </form>
        )}

        {!success && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <GoogleLoginButton />
          </>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
