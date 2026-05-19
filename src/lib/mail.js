import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function sendResetCode(email, code) {
  // --- Template HTML Dimulai Di Sini ---
  const htmlBody = `
  <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <h1 style="font-size: 24px; color: #333; text-align: center; margin-bottom: 25px;">
      Reset Password Saraspatika
    </h1>
    
    <p style="font-size: 16px; color: #555; line-height: 1.6;">
      Halo,
    </p>
    
    <p style="font-size: 16px; color: #555; line-height: 1.6;">
      Kami menerima permintaan untuk me-reset password akun Anda. Silakan gunakan kode verifikasi di bawah ini untuk melanjutkan.
    </p>
    
    <div style="background-color: #f4f4f7; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
      <p style="font-size: 16px; color: #555; margin-top: 0; margin-bottom: 15px;">Kode reset Anda adalah:</p>
      <b style="font-size: 38px; color: #111; letter-spacing: 4px; display: block; font-family: 'Courier New', Courier, monospace;">
        ${code}
      </b>
    </div>
    
    <p style="font-size: 16px; color: #555; line-height: 1.6;">
      Kode ini hanya berlaku selama <b>10 menit</b>.
    </p>
    
    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-top: 20px;">
      Jika Anda tidak merasa meminta reset password ini, mohon abaikan email ini. Akun Anda tetap aman.
    </p>
    
    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #999; text-align: center;">
      © Saraspatika. All rights reserved.
    </p>
    
  </div>
  `;
  // --- Template HTML Berakhir Di Sini ---

  return transporter.sendMail({
    from: `"Saraspatika" <${env.GMAIL_USER}>`,
    to: email,
    subject: 'Kode Reset Password',
    // 'text' adalah fallback untuk email client yang tidak bisa render HTML
    text: `Kode reset Anda: ${code} (berlaku 10 menit)`,
    html: htmlBody, // Menggunakan template HTML yang baru
  });
}

export async function sendInitialPasswordSetupLink({ email, name, token, expiresAt }) {
  const safeName = escapeHtml(name || 'Pengguna');
  const safeEmail = escapeHtml(email);
  const setupUrl = `${String(env.APP_URL || '').replace(/\/+$/g, '')}/set-password?token=${encodeURIComponent(token)}`;
  const safeSetupUrl = escapeHtml(setupUrl);
  const safeExpiresAt = escapeHtml(
    expiresAt
      ? new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Makassar',
        }).format(expiresAt)
      : '',
  );

  const htmlBody = `
  <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <h1 style="font-size: 24px; color: #333; text-align: center; margin-bottom: 25px;">
      Akun Saraspatika Anda Telah Dibuat
    </h1>

    <p style="font-size: 16px; color: #555; line-height: 1.6;">
      Halo ${safeName},
    </p>

    <p style="font-size: 16px; color: #555; line-height: 1.6;">
      Akun Anda telah dibuat oleh admin. Silakan atur password akun Anda melalui tombol berikut.
    </p>

    <div style="background-color: #f4f4f7; border-radius: 8px; padding: 22px; margin: 24px 0;">
      <p style="font-size: 15px; color: #555; margin: 0 0 10px 0;"><b>Email:</b> ${safeEmail}</p>
      ${safeExpiresAt ? `<p style="font-size: 15px; color: #555; margin: 0;"><b>Berlaku sampai:</b> ${safeExpiresAt} WITA</p>` : ''}
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${safeSetupUrl}" style="display: inline-block; background-color: #237804; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-weight: 700;">
        Atur Password
      </a>
    </div>

    <p style="font-size: 14px; color: #777; line-height: 1.6; margin-top: 20px;">
      Jika tombol tidak dapat dibuka, salin link ini ke browser Anda:<br>
      <a href="${safeSetupUrl}" style="color: #237804; word-break: break-all;">${safeSetupUrl}</a>
    </p>

    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">

    <p style="font-size: 14px; color: #999; text-align: center;">
      Saraspatika. All rights reserved.
    </p>
  </div>
  `;

  return transporter.sendMail({
    from: `"Saraspatika" <${env.GMAIL_USER}>`,
    to: email,
    subject: 'Akun Saraspatika Anda Telah Dibuat',
    text: `Akun Saraspatika Anda telah dibuat.\n\nEmail: ${email}\nAtur password: ${setupUrl}${expiresAt ? `\nBerlaku sampai: ${safeExpiresAt} WITA` : ''}`,
    html: htmlBody,
  });
}
