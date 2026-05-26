  const mongoose = require("mongoose");
  const bcrypt = require("bcryptjs");

  const userSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [50, "Name cannot exceed 50 characters"],
      },
      email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
      },
      password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters"],
        select: false, // never returned by default
      },
      avatar: {
        type: String,
        default: "",
      },
      role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
      },

      // Google OAuth
      googleId: {
        type: String,
        default: null,
      },

      // Email verification
      isVerified: {
        type: Boolean,
        default: false,
      },
      emailVerificationToken: String,
      emailVerificationExpires: Date,

      // Password reset
      passwordResetToken: String,
      passwordResetExpires: Date,

      // Refresh tokens (stored as array to support multi-device)
      refreshTokens: {
        type: [String],
        select: false,
        default: [],
      },
    },
    { timestamps: true }
  );

  // Hash password before saving
  userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  // Compare entered password with hashed
  userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  module.exports = mongoose.model("User", userSchema);
