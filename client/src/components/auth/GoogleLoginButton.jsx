import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Google Sign-In button using Google Identity Services (GSI).
 * Add this script to your public/index.html <head>:
 *   <script src="https://accounts.google.com/gsi/client" async defer></script>
 * Set REACT_APP_GOOGLE_CLIENT_ID in your .env
 */
const GoogleLoginButton = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
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
  }, [googleLogin, navigate]);

  return (
    <div className="google-btn-wrap">
      <div ref={btnRef} />
      {!process.env.REACT_APP_GOOGLE_CLIENT_ID && (
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          Add REACT_APP_GOOGLE_CLIENT_ID to .env to enable Google login
        </p>
      )}
    </div>
  );
};

export default GoogleLoginButton;
