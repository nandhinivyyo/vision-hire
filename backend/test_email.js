require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  console.log("Starting SMTP test...");
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Sometimes needed for local/testing
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("Verifying connection...");
    const success = await transporter.verify();
    console.log("Verification success:", success);
    
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: "Test Email from VisionHire",
      text: "If you get this, SMTP is working!"
    });
    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (error) {
    console.error("SMTP Error:", error);
  }
}

test();
