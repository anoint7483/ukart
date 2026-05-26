const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  googleAuth,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/refresh", refreshToken);
router.post("/google", googleAuth);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected
router.get("/me", protect, getMe);

module.exports = router;
