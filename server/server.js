const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

dotenv.config();

// Connect DB
connectDB();

const app = express();

// ── Security Middleware ─────────────────────────────
app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ── Rate Limiting ──────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    message: "Too many requests, please try again later.",
  },
});

// ── Body Parser Middleware ─────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ─────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Health Route
app.get("/", (req, res) => {
  res.send("Ukart API is running...");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    time: new Date(),
  });
});

// ── 404 Handler ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ── Global Error Handler ───────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    message: err.message || "Server Error",
  });
});

// ── Server Start ───────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
