const nodemailer = require("nodemailer");

exports.sendEmail = async (to, subject, text) => {
  // Ensure environment variables are set and log them for debugging purposes
  const { EMAIL_HOST, EMAIL_PORT, SMTP_AUTH_METHOD, SMTP_USER, SMTP_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !SMTP_AUTH_METHOD || !SMTP_USER || !SMTP_PASS) {
    console.error("Missing environment variables for email configuration.");
    return;
  }

  console.log("Email configuration:");
  console.log(`Host: ${EMAIL_HOST}`);
  console.log(`Port: ${EMAIL_PORT}`);
  console.log(`Auth Method: ${SMTP_AUTH_METHOD}`);
  console.log(`User: ${SMTP_USER}`);

  let transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: SMTP_USER,
    to,
    subject,
    text,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};
