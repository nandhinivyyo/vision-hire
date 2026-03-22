const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  // Use legitimate SMTP if environment variables are set
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: Use ethereal for local testing without leaking credentials
    console.log("⚠️ No SMTP credentials found. Using Ethereal Email test account...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const message = {
    from: `${process.env.FROM_NAME || 'VisionHire Admin'} <${process.env.FROM_EMAIL || 'noreply@visionhire.local'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html || `<p>${options.message}</p>`,
  };

  const info = await transporter.sendMail(message);

  if (!process.env.SMTP_HOST) {
    console.log('✉️ Message sent: %s', info.messageId);
    console.log('🔗 Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
