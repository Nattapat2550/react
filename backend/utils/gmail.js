const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // ต้องตั้งใน .env
    pass: process.env.GMAIL_PASS, // App Password 16 หลัก
  },
});

async function sendEmail({ to, subject, text, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('❌ GMAIL config missing. Cannot send email.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"MyService" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error('🔥 Failed to send email:', err);
    throw err; // โยน error กลับไปเพื่อให้ frontend รู้ว่าส่งไม่สำเร็จ
  }
}

module.exports = { sendEmail };