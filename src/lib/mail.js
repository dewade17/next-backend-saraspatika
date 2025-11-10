import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
});

export async function sendResetCode(email, code) {
  return transporter.sendMail({
    from: `"Saraspatika" <${env.GMAIL_USER}>`,
    to: email,
    subject: 'Kode Reset Password',
    text: `Kode reset Anda: ${code} (berlaku 10 menit)`,
    html: `<p>Kode reset Anda: <b>${code}</b> (berlaku 10 menit)</p>`,
  });
}
