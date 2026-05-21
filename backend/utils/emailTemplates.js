/**
 * Generates the OTP email HTML template in the Seatify application theme.
 * Uses inline styling compatible with modern email clients.
 *
 * @param {string} otp The 6-digit verification code.
 * @returns {string} The compiled responsive HTML template.
 */
const getOTPHtml = (otp) => {
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Identity - Seatify</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(180deg, #EEF2FF 0%, #F8FAFC 100%); font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #EEF2FF 0%, #F8FAFC 100%); min-height: 100vh; padding: 40px 10px;">
        <tr>
          <td align="center" valign="top">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #FFFFFF; border: 1px solid #E0E7FF; border-radius: 24px; overflow: hidden; box-shadow: 0 18px 48px rgba(79, 70, 229, 0.10);">
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #4F46E5 0%, #2563EB 100%);"></td>
              </tr>

              <tr>
                <td align="center" style="padding: 32px 40px; background: linear-gradient(135deg, #111827 0%, #1E293B 100%); text-align: center;">
                  <div style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.08);">
                    <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: #FFFFFF;">Seatify</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 36px 40px 16px 40px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">Verification Code</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 40px 24px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4B5563;">
                    You are signing in to your Seatify account. Use the secure One-Time Password (OTP) below to complete the verification process.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 40px 32px 40px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%); border: 1px solid #E0E7FF; border-left: 4px solid #4F46E5; border-radius: 16px; padding: 24px 20px; text-align: center;">
                    <tr>
                      <td>
                        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #4F46E5; display: block; margin-bottom: 12px;">Your Verification Code</span>
                        <span style="font-size: 40px; font-weight: 800; color: #0F172A; font-family: 'Courier New', Courier, monospace; letter-spacing: 12px; display: inline-block; padding-left: 12px; line-height: 1;">${otp}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 40px 32px 40px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 14px; padding: 14px 18px;">
                    <tr>
                      <td style="font-size: 13px; line-height: 1.6; color: #3730A3; text-align: left;">
                        This OTP is valid for <strong>10 minutes</strong>. For your security, please do not share this email or code with anyone.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 40px 40px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6B7280;">
                    If you did not request this OTP, you can safely disregard this email. Your account security remains intact.
                  </p>
                  <p style="margin: 14px 0 0 0; font-size: 13px; line-height: 1.5; color: #4B5563;">
                    Need help? Contact us at
                    <a href="mailto:support@seatifyai.com" style="color: #4F46E5; font-weight: 700; text-decoration: none;">support@seatifyai.com</a>.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 32px 40px; background-color: #F8FAFC; border-top: 1px solid #E0E7FF; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #334155;">Securely delivered by Seatify</p>
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                    © ${currentYear} Seatify. All rights reserved.
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
 * Returns the attachment config for email templates.
 *
 * @returns {Array} Nodemailer attachments configuration array.
 */
const getEmailAttachments = () => {
  return [];
};

module.exports = {
  getOTPHtml,
  getEmailAttachments
};
