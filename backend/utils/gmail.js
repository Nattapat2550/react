// react/backend/utils/gmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // e.g. "myemail@gmail.com"
    pass: process.env.GMAIL_PASS, // App Password 16 หลัก
  },
});

async function sendEmail({ to, subject, text, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('GMAIL_USER or GMAIL_PASS missing. Skipping email.');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

module.exports = { sendEmail };