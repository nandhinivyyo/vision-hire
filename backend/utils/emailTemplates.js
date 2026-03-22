const templateWrapper = (content, url) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #0f0a0a;
      color: #e5e5e5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #1a1410;
      border: 1px solid rgba(249, 115, 22, 0.2);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #ffffff;
      margin-bottom: 24px;
    }
    .logo span {
      color: #FF6A00;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #FF6A00, #EA580C) !important;
      background-color: #FF6A00;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      letter-spacing: 1px;
      margin: 24px 0;
      box-shadow: 0 4px 15px rgba(255, 106, 0, 0.3);
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #888888;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">VISION<span>HIRE</span></div>
    ${content}
    <div class="footer">
      If you're having trouble clicking the button, copy and paste the URL below into your web browser:<br>
      <small style="color: #FF6A00;">${url}</small>
    </div>
  </div>
</body>
</html>
`;

const getVerificationEmailTemplate = (url, isAdminCreated = false) => {
  const content = `
    <h2 style="color: #ffffff; margin-bottom: 16px;">Verify Your Email Address</h2>
    <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      ${isAdminCreated 
        ? "Welcome to VisionHire! An administrator has created a new account for you. Please verify your email address to activate your account and set up your profile."
        : "Welcome to VisionHire! Thank you for registering. To get started with your AI mock interviews, please verify your email address by clicking the button below."}
    </p>
    <a href="${url}" class="btn">Verify Email Address &rarr;</a>
  `;
  return templateWrapper(content, url);
};

const getResetPasswordTemplate = (url) => {
  const content = `
    <h2 style="color: #ffffff; margin-bottom: 16px;">Reset Your Password</h2>
    <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      We received a request to reset the password for your VisionHire account. 
      If you made this request, click the button below to securely create a new password. 
      If you didn't request this, you can safely ignore this email.
    </p>
    <a href="${url}" class="btn">Securely Reset Password &rarr;</a>
  `;
  return templateWrapper(content, url);
};

module.exports = {
  getVerificationEmailTemplate,
  getResetPasswordTemplate
};
