const jwt = require("jsonwebtoken");

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

/**
 * Generate a short-lived access token (15 min)
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, getAccessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
};

/**
 * Generate a long-lived refresh token (7 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

/**
 * Set refresh token as httpOnly cookie
 */
const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

/**
 * Clear refresh cookie
 */
const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
