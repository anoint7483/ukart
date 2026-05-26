const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email verification link
 */
const sendVerificationEmail = async (to, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
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
  });
};

/**
 * Send password reset link
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
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
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
