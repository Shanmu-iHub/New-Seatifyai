const path = require('path');

/**
 * Generates the premium and highly responsive OTP Email HTML template in a stunning Light Theme (White, Gray, Yellow, and Black).
 * Uses inline styling compatible with modern email clients (Gmail, Outlook, Apple Mail, etc.).
 *
 * @param {string} otp The 6-digit verification code.
 * @returns {string} The fully compiled responsive HTML template.
 */
const getOTPHtml = (otp) => {
  const currentYear = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Identity - Seatifyai</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; min-height: 100vh; padding: 40px 10px;">
        <tr>
          <td align="center" valign="top">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);">
              
              <!-- Color Accent Top Line -->
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #FACC15 0%, #EAB308 100%);"></td>
              </tr>

              <!-- Header with Logo (Uses pure black background to perfectly blend the logo image's black background) -->
              <tr>
                <td align="center" style="padding: 32px 40px; background-color: #000000; text-align: center;">
                  <img src="cid:seatifyLogo" alt="Seatifyai Logo" style="height: 52px; width: auto; display: inline-block; max-width: 200px; background-color: #000000; vertical-align: middle;" />
                </td>
              </tr>

              <!-- Title -->
              <tr>
                <td style="padding: 36px 40px 16px 40px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">Verification Code</h1>
                </td>
              </tr>

              <!-- Body Text -->
              <tr>
                <td style="padding: 0 40px 24px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4B5563;">
                    You are signing in to your Seatifyai account. Use the secure One-Time Password (OTP) below to complete the verification process.
                  </p>
                </td>
              </tr>

              <!-- OTP Container -->
              <tr>
                <td style="padding: 0 40px 32px 40px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #EAB308; border-radius: 14px; padding: 24px 20px; text-align: center;">
                    <tr>
                      <td>
                        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #6B7280; display: block; margin-bottom: 12px;">Your Verification Code</span>
                        <span style="font-size: 40px; font-weight: 800; color: #111827; font-family: 'Courier New', Courier, monospace; letter-spacing: 12px; display: inline-block; padding-left: 12px; line-height: 1;">${otp}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Expiry Alert -->
              <tr>
                <td style="padding: 0 40px 32px 40px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFDF0; border: 1px solid #FEF08A; border-radius: 10px; padding: 14px 18px;">
                    <tr>
                      <td style="font-size: 13px; line-height: 1.5; color: #713F12; text-align: left;">
                        ⏳ This OTP is valid for <strong>10 minutes</strong>. For maximum security, please do not share this email or code with anyone.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Disclaimer/Support -->
              <tr>
                <td style="padding: 0 40px 40px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6B7280;">
                    If you did not request this OTP, you can safely disregard this email. Your account security remains intact.
                  </p>
                </td>
              </tr>

              <!-- Footer background -->
              <tr>
                <td style="padding: 32px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 500; color: #4B5563;">Securely delivered by Seatifyai</p>
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                    © ${currentYear} Seatifyai. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Returns the attachment config for embedding the Seatify Logo in nodemailer emails.
 *
 * @returns {Array} Nodemailer attachments configuration array.
 */
const getEmailAttachments = () => {
  return [
    {
      filename: 'logo.webp',
      path: path.join(__dirname, '../../frontend/public/logo.webp'),
      cid: 'seatifyLogo'
    }
  ];
};

module.exports = {
  getOTPHtml,
  getEmailAttachments
};
