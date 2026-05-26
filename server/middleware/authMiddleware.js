const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");

/**
 * Protect routes - verifies JWT access token from Authorization header
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authorized. No token." });

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // Attach user to request (without sensitive fields)
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Restrict to specific roles
 * Usage: authorize("admin")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role))
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    next();
  };
};

module.exports = { protect, authorize };
