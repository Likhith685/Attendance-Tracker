import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { escapeHtml } from '../utils/html.js';
import { logger } from '../utils/logger.js';

const TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };

let transporterPromise;

async function createTransporter() {
  if (env.EMAIL_USER && env.EMAIL_PASS) {
    logger.info('Absence notifications will be sent over SMTP');
    return nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
      pool: true,
      maxConnections: 5,
      ...TIMEOUTS,
    });
  }

  if (env.isDevelopment) {
    const account = await nodemailer.createTestAccount();
    logger.info('No SMTP credentials set; using an Ethereal test inbox (preview URLs are logged)');
    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
      ...TIMEOUTS,
    });
  }

  logger.warn('EMAIL_USER/EMAIL_PASS are not set; absence notifications are disabled');
  return null;
}

function getTransporter() {
  transporterPromise ??= createTransporter().catch((err) => {
    transporterPromise = undefined; // allow a retry on the next send
    throw err;
  });
  return transporterPromise;
}

function renderAbsenceEmail({ studentName, roll, courseName, date }) {
  const name = escapeHtml(studentName);
  const course = escapeHtml(courseName);
  const day = escapeHtml(date);
  const rollNo = escapeHtml(roll);

  const text = [
    `Dear ${studentName} (Roll: ${roll}),`,
    '',
    `You were marked ABSENT for the class "${courseName}" on ${date}.`,
    '',
    'Please contact your teacher if you believe this is an error.',
    '',
    'Best regards,',
    'Attendance Tracker',
  ].join('\n');

  const html = `
    <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #121212; color: #fff; padding: 30px; border-radius: 12px; max-width: 500px; border: 1px solid rgba(229, 9, 20, 0.3);">
      <h2 style="color: #e50914; margin-top: 0;">Absence Alert</h2>
      <p style="font-size: 15px; color: #e0e0e0;">Dear <strong>${name}</strong> (Roll: ${rollNo}),</p>
      <p style="font-size: 14px; color: #b3b3b3; line-height: 1.6;">
        This is to inform you that you were marked <strong style="color: #ef4444;">ABSENT</strong>
        for the lecture of <strong>${course}</strong> on <strong>${day}</strong>.
      </p>
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 13px; color: #8c8c8c; display: block;">Course:</span>
        <strong style="font-size: 15px; color: #fff;">${course}</strong>
        <span style="font-size: 13px; color: #8c8c8c; display: block; margin-top: 8px;">Date:</span>
        <strong style="font-size: 15px; color: #fff;">${day}</strong>
      </div>
      <p style="font-size: 13px; color: #8c8c8c;">Please contact your course instructor if you believe this is an error.</p>
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;">
      <p style="font-size: 12px; color: #666; margin: 0;">
        This is an automated notification from Attendance Tracker. Please do not reply directly to this email.
      </p>
    </div>`;

  return { subject: `Absence Warning: ${courseName} - ${date}`, text, html };
}

/**
 * Sends absence notifications. Never throws: delivery problems are logged so
 * they cannot fail the attendance request that triggered them.
 * @param {{ to: string, studentName: string, roll: number }[]} recipients
 */
export async function sendAbsenceEmails(recipients, { courseName, date }) {
  if (!env.emailEnabled || recipients.length === 0) return { sent: 0, failed: 0 };

  let transporter;
  try {
    transporter = await getTransporter();
  } catch (err) {
    logger.error({ err }, 'Failed to configure the email transport');
    return { sent: 0, failed: recipients.length };
  }
  if (!transporter) return { sent: 0, failed: 0 };

  const results = await Promise.allSettled(
    recipients.map(async ({ to, studentName, roll }) => {
      const info = await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        ...renderAbsenceEmail({ studentName, roll, courseName, date }),
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) logger.info({ previewUrl }, 'Absence email preview');
    }),
  );

  const failures = results.filter((result) => result.status === 'rejected');
  failures.forEach(({ reason }) => logger.error({ err: reason }, 'Failed to send absence email'));
  return { sent: results.length - failures.length, failed: failures.length };
}
