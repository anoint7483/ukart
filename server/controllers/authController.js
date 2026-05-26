const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../utils/jwt");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ─────────────────────────────────────────
   Helper: build safe user object
───────────────────────────────────────── */
const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  isVerified: user.isVerified,
});

/* ─────────────────────────────────────────
   POST /api/auth/register
───────────────────────────────────────── */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    // Email verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verifyToken).digest("hex");

    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
    });

    await sendVerificationEmail(user.email, user.name, verifyToken);

    res.status(201).json({
      message: "Registered! Please check your email to verify your account.",
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/login
───────────────────────────────────────── */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email }).select("+password +refreshTokens");
    if (!user || !user.password)
      return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email before logging in" });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Persist refresh token (max 5 devices)
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.json({ accessToken, user: safeUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/logout
───────────────────────────────────────── */
exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      // Remove this specific refresh token from DB
      const user = await User.findById(req.user?.id).select("+refreshTokens");
      if (user) {
        user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== token);
        await user.save();
      }
    }
    clearRefreshCookie(res);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/refresh
   Rotates refresh token on each use
───────────────────────────────────────── */
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id).select("+refreshTokens");
    if (!user || !user.refreshTokens.includes(token))
      return res.status(403).json({ message: "Refresh token revoked" });

    // Rotate: remove old, issue new
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    const accessToken = generateAccessToken(user._id, user.role);
    res.json({ accessToken, user: safeUser(user) });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/google
   Google OAuth (ID token from frontend)
───────────────────────────────────────── */
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "No Google credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] }).select("+refreshTokens");

    if (!user) {
      user = await User.create({
        googleId,
        name,
        email,
        avatar: picture,
        isVerified: true, // Google already verified
        refreshTokens: [],
      });
    } else if (!user.googleId) {
      // Link Google to existing email account
      user.googleId = googleId;
      user.isVerified = true;
      user.avatar = user.avatar || picture;
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save();

    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user: safeUser(user) });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Google authentication failed" });
  }
};

/* ─────────────────────────────────────────
   GET /api/auth/verify-email?token=...
───────────────────────────────────────── */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token missing" });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token is invalid or has expired" });

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified! You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/resend-verification
───────────────────────────────────────── */
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verifyToken).digest("hex");

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, user.name, verifyToken);
    res.json({ message: "Verification email resent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/forgot-password
───────────────────────────────────────── */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond the same to prevent email enumeration
    const genericMsg = "If that email exists, a reset link has been sent.";
    if (!user) return res.json({ message: genericMsg });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, user.name, resetToken);
    res.json({ message: genericMsg });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/reset-password
───────────────────────────────────────── */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: "Token and new password are required" });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+refreshTokens");

    if (!user)
      return res.status(400).json({ message: "Token is invalid or has expired" });

    user.password = password; // hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    clearRefreshCookie(res);
    res.json({ message: "Password reset successful. Please log in again." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   GET /api/auth/me  (protected)
───────────────────────────────────────── */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
