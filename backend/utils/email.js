const nodemailer = require('nodemailer');
const generateCode = require('./generateCode');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

module.exports = {
  sendVerification: async (email, code) => {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Verification Code',
      text: `Your 6-digit code: ${code}`
    });
  },
  sendReset: async (email, code) => {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset',
      text: `Your reset code: ${code}`
    });
  },
  generateAndSendCode: async (email, type = 'verification') => {
    const code = generateCode();
    await db.query('UPDATE users SET verification_code = $1 WHERE email = $2', [code, email]);
    if (type === 'verification') {
      await this.sendVerification(email, code);
    } else {
      await this.sendReset(email, code);
    }
    return code;
  }
};