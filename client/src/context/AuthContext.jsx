import { useReducer, useCallback, useEffect } from "react";
import api from "../api/api";
import { AuthContext } from "./authContextValue";

const initialState = {
  user: null,
  accessToken: null,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload.user, accessToken: action.payload.accessToken, loading: false, error: null };
    case "LOGOUT":
      return { ...initialState, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "UPDATE_USER":
      return { ...state, user: action.payload, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: try to restore session via refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.post("/auth/refresh");
        window.__accessToken = res.data.accessToken;
        dispatch({ type: "SET_USER", payload: { user: res.data.user, accessToken: res.data.accessToken } });
      } catch {
        window.__accessToken = null;
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const handleForcedLogout = () => dispatch({ type: "LOGOUT" });
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  const register = useCallback(async (name, email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await api.post("/auth/register", { name, email, password });
      dispatch({ type: "SET_LOADING", payload: false });
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      dispatch({ type: "SET_ERROR", payload: msg });
      return { success: false, message: msg };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await api.post("/auth/login", { email, password });
      window.__accessToken = res.data.accessToken;
      dispatch({ type: "SET_USER", payload: { user: res.data.user, accessToken: res.data.accessToken } });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      dispatch({ type: "SET_ERROR", payload: msg });
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${state.accessToken}` },
      });
    } catch {
      // Logout should still clear local state when the server session is already gone.
    }
    window.__accessToken = null;
    dispatch({ type: "LOGOUT" });
  }, [state.accessToken]);

  const googleLogin = useCallback(async (credential) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await api.post("/auth/google", { credential });
      window.__accessToken = res.data.accessToken;
      dispatch({ type: "SET_USER", payload: { user: res.data.user, accessToken: res.data.accessToken } });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Google login failed";
      dispatch({ type: "SET_ERROR", payload: msg });
      return { success: false, message: msg };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const res = await api.post("/auth/forgot-password", { email });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to send reset email" };
    }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    try {
      const res = await api.post("/auth/reset-password", { token, password });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Password reset failed" };
    }
  }, []);

  const updateProfile = useCallback(async (name, avatar) => {
    try {
      const res = await api.patch("/auth/profile", { name, avatar });
      dispatch({ type: "UPDATE_USER", payload: res.data.user });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Profile update failed" };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const res = await api.patch("/auth/change-password", { currentPassword, newPassword });
      window.__accessToken = null;
      dispatch({ type: "LOGOUT" });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Password change failed" };
    }
  }, []);

  const setAccessToken = useCallback((token) => {
    window.__accessToken = token;
    dispatch({ type: "SET_USER", payload: { user: state.user, accessToken: token } });
  }, [state.user]);

  return (
    <AuthContext.Provider value={{
      ...state,
      register,
      login,
      logout,
      googleLogin,
      forgotPassword,
      resetPassword,
      updateProfile,
      changePassword,
      setAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
