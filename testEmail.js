// testEmail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const sendTestEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log('Server is ready to take our messages');

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

sendTestEmail();
