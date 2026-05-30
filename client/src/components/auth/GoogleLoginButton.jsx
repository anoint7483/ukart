import { useEffect, useRef } from "react";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

/**
 * Google Sign-In button using Google Identity Services (GSI).
 * Add this script to your public/index.html <head>:
 *   <script src="https://accounts.google.com/gsi/client" async defer></script>
 * Set VITE_GOOGLE_CLIENT_ID in your .env
 */
const GoogleLoginButton = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        const result = await googleLogin(credential);
        if (result.success) navigate("/");
      },
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "continue_with",
      shape: "rectangular",
    });
  }, [clientId, googleLogin, navigate]);

  return (
    <div className="google-btn-wrap">
      <div ref={btnRef} />
      {!clientId && (
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
        </p>
      )}
    </div>
  );
};

export default GoogleLoginButton;
