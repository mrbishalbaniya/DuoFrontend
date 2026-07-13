import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type RelaySmtpConfig = {
  host: string;
  port: number;
  secure?: boolean;
  requireTLS?: boolean;
  auth: {
    user: string;
    pass: string;
  };
};

export type RelayEmailPayload = {
  smtp: RelaySmtpConfig;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

export async function sendRelayEmail(payload: RelayEmailPayload) {
  const transportOptions: SMTPTransport.Options = {
    host: payload.smtp.host,
    port: payload.smtp.port,
    secure: Boolean(payload.smtp.secure),
    auth: {
      user: payload.smtp.auth.user,
      pass: payload.smtp.auth.pass,
    },
  };

  if (payload.smtp.requireTLS) {
    transportOptions.requireTLS = true;
  }

  const transporter = nodemailer.createTransport(transportOptions);

  return transporter.sendMail({
    from: payload.from,
    to: payload.to.join(", "),
    subject: payload.subject,
    text: payload.text,
    html: payload.html || undefined,
  });
}
