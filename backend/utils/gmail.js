// react/backend/utils/gmail.js
const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');

// ดึงค่าจาก .env
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // ต้องตรงกับตอนขอ Token
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

async function sendEmail({ to, subject, text, html }) {
  // เช็คว่าปิดระบบอีเมลไว้หรือไม่
  if (process.env.EMAIL_DISABLE === 'true') {
    console.log('🚫 Email sending is DISABLED in .env');
    return;
  }

  try {
    console.log(`📨 Preparing to send email to: ${to}`);

    const mail = new MailComposer({
      to,
      subject,
      text,
      html,
      from: SENDER_EMAIL || 'Noreply <noreply@example.com>',
    });

    const message = await new Promise((resolve, reject) => {
      mail.compile().build((err, msg) => (err ? reject(err) : resolve(msg)));
    });

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log('✅ Email sent successfully via Gmail API!');
  } catch (error) {
    console.error('🔥 Failed to send email:', error.message);
    if (error.response) {
      console.error('   Details:', error.response.data);
    }
  }
}

module.exports = { sendEmail };