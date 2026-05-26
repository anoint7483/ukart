import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";
import "../styles/auth.css";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
      });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link to="/" className="auth-logo">u<span>Kart</span></Link>
      </div>

      <div className="auth-card auth-card--centered">
        {status === "loading" && (
          <>
            <div className="auth-spinner auth-spinner--lg" />
            <p className="auth-subtitle" style={{ marginTop: 16 }}>Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="auth-icon">✅</div>
            <h1 className="auth-title">Email verified!</h1>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="auth-btn" style={{ display: "inline-block", textDecoration: "none", textAlign: "center", marginTop: 16 }}>
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="auth-icon">❌</div>
            <h1 className="auth-title">Verification failed</h1>
            <p className="auth-subtitle">{message}</p>
            <Link to="/resend-verification" className="auth-link" style={{ marginTop: 12, display: "inline-block" }}>
              Resend verification email
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
