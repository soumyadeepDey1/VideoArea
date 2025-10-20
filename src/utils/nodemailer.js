import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

// Validate required environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new ApiError(
    500,
    "Email configuration is missing. Please check environment variables."
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMail = async ({ to, subject, text, html }) => {
  try {
    // Input validation
    if (!to) throw new ApiError(400, "Recipient email is required");
    if (!subject) throw new ApiError(400, "Email subject is required");
    if (!text && !html)
      throw new ApiError(400, "Email content (text or html) is required");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to:to,
      subject:subject,
      text:text,
      html:html,
    });

    return info;
  } catch (error) {
    throw new ApiError(500, "Failed to send email", [
      error?.message || "Unknown error occurred",
    ]);
  }
};
