require('dotenv').config();
const sendEmail = require('./utils/sendEmail');
const { getVerificationEmailTemplate } = require('./utils/emailTemplates');

async function test() {
  console.log("Testing email with HTML template...");
  const frontendVerifyUrl = 'http://localhost:3000/verify/testtoken123';
  
  try {
    const rawTemplate = getVerificationEmailTemplate(frontendVerifyUrl, false);
    console.log("Template generated successfully. Length:", rawTemplate.length);
    
    await sendEmail({
      email: process.env.SMTP_USER, // Send to self
      subject: 'Test HTML Verification',
      message: 'If you cannot see HTML, here is the text link: ' + frontendVerifyUrl,
      html: rawTemplate
    });
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Failed to send:", err);
  }
}

test();
