import request from "superagent";
import nodemailer from "nodemailer";

const hasSmtpConfig = () =>
  Boolean(
    (process.env.SMTP_SERVICE || process.env.SMTP_HOST) &&
      process.env.SMTP_EMAIL &&
      process.env.SMTP_PASSWORD
  );

const isBrevoIpRestriction = (message = "") =>
  /unrecognised ip address|unrecognized ip address/i.test(message);

const buildFallbackHtml = (options) => {
  if (options.message) return options.message;

  const otp = options?.params?.otp;
  if (otp) {
    return `<p>Your verification code is: <strong style="font-size: 1.2em; color: #2563eb;">${otp}</strong></p><p>This code expires in 10 minutes.</p>`;
  }

  const name = options?.params?.name || "Learner";
  const loginUrl = options?.params?.loginUrl || `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;

  return `<p>Hello ${name},</p><p>Welcome to CodeLMS.</p><p><a href="${loginUrl}">Click here to login</a></p>`;
};

const sendViaBrevo = async (options) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const payload = {
    to: [{ email: options.email }],
    sender: {
      name: process.env.FROM_NAME || "CodeLMS Team",
      email: process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_EMAIL
    }
  };

  const tid = Number(options.templateId);
  if (options.templateId && !Number.isNaN(tid) && tid > 0) {
    payload.templateId = tid;
    payload.params = options.params || {};
  } else {
    payload.subject = options.subject || "CodeLMS Notification";
    payload.htmlContent = buildFallbackHtml(options);
  }

  const response = await request
    .post("https://api.brevo.com/v3/smtp/email")
    .set("api-key", process.env.BREVO_API_KEY)
    .set("Content-Type", "application/json")
    .set("Accept", "application/json")
    .send(payload);

  console.log("Email sent via Brevo");
  return response.body;
};

const sendViaSmtp = async (options) => {
  if (!hasSmtpConfig()) {
    throw new Error("SMTP is not configured");
  }

  const usingService = Boolean(process.env.SMTP_SERVICE);
  const smtpConfig = usingService
    ? {
        service: process.env.SMTP_SERVICE,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      }
    : {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      };

  const transporter = nodemailer.createTransport(smtpConfig);

  const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_EMAIL;
  const fromName = process.env.FROM_NAME || "CodeLMS Team";

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: options.email,
    subject: options.subject || "CodeLMS Notification",
    html: buildFallbackHtml(options)
  });

  console.log("Email sent via SMTP");
  return info;
};

/**
 * Sends an email with provider fallback:
 * 1) Brevo
 * 2) SMTP (if configured)
 */
const sendEmail = async (options) => {
  const errors = [];

  try {
    return await sendViaBrevo(options);
  } catch (error) {
    const msg = error?.response?.body?.message || error.message;
    errors.push(`Brevo: ${msg}`);
    console.error("Brevo email failed:", msg);
  }

  if (hasSmtpConfig()) {
    try {
      return await sendViaSmtp(options);
    } catch (error) {
      errors.push(`SMTP: ${error.message}`);
      console.error("SMTP email failed:", error.message);
    }
  }

  const combined = errors.join(" | ");

  if (isBrevoIpRestriction(combined)) {
    throw new Error(
      "Brevo blocked this IP. Add your current IP in Brevo Authorised IPs or configure SMTP fallback in .env"
    );
  }

  throw new Error(combined || "Email sending failed. No email provider available.");
};

export default sendEmail;
