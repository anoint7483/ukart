const nodemailer = require("nodemailer");

const hasEmailConfig =
  process.env.EMAIL_HOST &&
  process.env.EMAIL_PORT &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS;

const transporter = hasEmailConfig
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

const sendMail = async (options, fallbackUrl) => {
  if (!transporter) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service is not configured");
    }

    console.log("Email service is not configured. Use this link for local testing:");
    console.log(fallbackUrl);
    return;
  }

  await transporter.sendMail(options);
};

/**
 * Send email verification link
 */
const sendVerificationEmail = async (to, name, token) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

  await sendMail({
    from: `"uKart" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your uKart email",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#e11d48">Welcome to uKart, ${name}!</h2>
        <p>Please verify your email address by clicking the button below. This link expires in <strong>24 hours</strong>.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 28px;background:#e11d48;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px">If you didn't sign up, ignore this email.</p>
      </div>
    `,
  }, verifyUrl);
};

/**
 * Send password reset link
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  await sendMail({
    from: `"uKart" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your uKart password",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#e11d48">Password Reset Request</h2>
        <p>Hi ${name}, click below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 28px;background:#e11d48;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px">If you didn't request this, ignore this email. Your password is safe.</p>
      </div>
    `,
  }, resetUrl);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
