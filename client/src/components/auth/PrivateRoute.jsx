import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

/**
 * Wraps protected routes.
 * Usage: <Route element={<PrivateRoute />}> <Route path="/dashboard" element={<Dashboard />} /> </Route>
 *
 * adminOnly prop restricts to admin role.
 */
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <span style={{ fontSize: 32 }}>⏳</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
