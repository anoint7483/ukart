import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // { type: "success"|"error", message }
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await forgotPassword(email);
    setStatus({ type: result.success ? "success" : "error", message: result.message });
    setSubmitting(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link to="/" className="auth-logo">u<span>Kart</span></Link>
      </div>

      <div className="auth-card">
        <div className="auth-icon">🔑</div>
        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-subtitle">Enter your email and we'll send a reset link.</p>

        {status && (
          <div className={`auth-alert auth-alert--${status.type}`}>{status.message}</div>
        )}

        {!status?.type === "success" && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="auth-btn" type="submit" disabled={submitting}>
              {submitting ? <span className="auth-spinner" /> : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Remember it? <Link to="/login" className="auth-link">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
