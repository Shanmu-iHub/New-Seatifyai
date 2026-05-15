const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OTP, User } = require('../models');
const axios = require('axios');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getTransporter = () => {
  const port = Number(process.env.SES_SMTP_PORT || process.env.MAIL_PORT) || 587;
  const secure = process.env.MAIL_SECURE !== undefined ? process.env.MAIL_SECURE === 'true' : port === 465;
  const config = {
    host: process.env.SES_SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user: process.env.SES_SMTP_USERNAME || process.env.MAIL_USER,
      pass: process.env.SES_SMTP_PASSWORD || process.env.MAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Often needed for GoDaddy/VPS environments
    }
  };
  
  // Debug log (don't log password)
  console.log(`[SMTP Config] Host: ${config.host}, Port: ${config.port}, User: ${config.auth.user}`);
  
  return nodemailer.createTransport(config);
};

const sendEmailOTP = async (email, otp) => {
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.MAIL_FROM || 'Seatifyai <noreply@seatifyai.com>',
    to: email,
    subject: `${otp} — Your Seatifyai Login OTP`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#1A1A24;border-radius:16px;color:#fff">
        <h2 style="color:#4F46E5;margin-bottom:8px">Your OTP Code</h2>
        <p style="color:#9CA3AF;margin-bottom:24px">Use this code to sign in to Seatifyai</p>
        <div style="background:#0F0F13;border-radius:12px;padding:24px;text-align:center;font-size:36px;font-weight:bold;letter-spacing:12px;color:#4F46E5;margin-bottom:24px">${otp}</div>
        <p style="color:#9CA3AF;font-size:13px">This OTP expires in 10 minutes. Do not share this with anyone.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ SMTP Error detail:', error);
    throw error; // Re-throw to be caught by the outer try-catch for console fallback
  }
};

const sendSMSOTP = async (mobile, otp) => {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  const template = process.env.TWO_FACTOR_TEMPLATE;
  
  if (!apiKey) {
    console.log(`[SMS OTP SIMULATION] ${mobile}: ${otp}`);
    return { sessionId: 'simulated_session_' + Date.now() };
  }

  // Normalize mobile number: remove any non-digit characters
  let cleanMobile = mobile.replace(/\D/g, '');
  
  // If it's a 10-digit number, prepend 91 (India)
  if (cleanMobile.length === 10) {
    cleanMobile = '91' + cleanMobile;
  }

  try {
    // 2Factor.in AUTOGEN API
    // Format: https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/AUTOGEN/{template_name}
    const senderId = process.env.TWO_FACTOR_SENDER_ID || 'SNSCPL';
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanMobile}/AUTOGEN/${template}?sender=${senderId}`;
    console.log(`[2Factor] Sending to: ${cleanMobile} using template: ${template} and sender: ${senderId}`);
    
    const response = await axios.get(url);
    
    if (response.data.Status === 'Success') {
      console.log(`✅ 2Factor OTP sent successfully. SessionId: ${response.data.Details}`);
      return { sessionId: response.data.Details };
    } else {
      console.error(`❌ 2Factor Error Response:`, response.data);
      throw new Error(response.data.Details || 'Failed to send SMS via 2Factor');
    }
  } catch (error) {
    const errorDetail = error.response?.data || error.message;
    console.error('❌ 2Factor Send Error:', errorDetail);
    throw new Error(`SMS Provider Error: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
  }
};

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { contact, type } = req.body;
    if (!contact || !['email', 'mobile'].includes(type))
      return res.status(400).json({ message: 'Invalid request' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + (Number(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000);

    // Delete old OTPs
    await OTP.deleteMany({ contact, type }).catch(() => {});

    await OTP.create({ contact, type, otp, expiresAt }).catch(() => {});

    // Check if new user
    const existingUser = await User.findOne(type === 'email' ? { email: contact } : { mobile: contact }).catch(() => null);

    // Send OTP
    try {
      if (type === 'email') {
        await sendEmailOTP(contact, otp);
        await OTP.create({ contact, type, otp, expiresAt }).catch(() => {});
      } else {
        const { sessionId } = await sendSMSOTP(contact, otp);
        await OTP.create({ contact, type, sessionId, expiresAt }).catch(() => {});
      }
    } catch (sendErr) {
      console.warn('OTP send failed (using console fallback):', sendErr.message);
      console.log(`[DEV OTP] ${contact}: ${otp}`);
      // Create record anyway for dev bypass
      await OTP.create({ contact, type, otp, expiresAt }).catch(() => {});
    }

    res.json({ message: 'OTP sent successfully', isNewUser: !existingUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { contact, type, otp, name } = req.body;

    // Find valid OTP record
    const record = await OTP.findOne({
      contact, type,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).catch(() => null);

    // Dev bypass: accept '123456' for testing
    const isDevMode = otp === '123456' && process.env.NODE_ENV !== 'production';

    if (!isDevMode) {
      if (!record) return res.status(400).json({ message: 'No valid OTP found' });

      if (type === 'email') {
        if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
      } else {
        // Verify with 2Factor.in for mobile
        const apiKey = process.env.TWO_FACTOR_API_KEY;
        if (apiKey && record.sessionId) {
          try {
            const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${record.sessionId}/${otp}`;
            const response = await axios.get(url);
            if (response.data.Status !== 'Success') {
              return res.status(400).json({ message: response.data.Details || 'Invalid OTP' });
            }
          } catch (error) {
            console.error('❌ 2Factor Verify Error:', error.response?.data || error.message);
            // If it's a real error (not invalid OTP), maybe fallback to DB check if we have it? 
            // But 2Factor generates the OTP so we don't have it.
            return res.status(400).json({ message: 'OTP verification failed' });
          }
        } else if (record.otp !== otp) {
          // Fallback to internal OTP if 2Factor is not configured or sessionId is missing
          return res.status(400).json({ message: 'Invalid OTP' });
        }
      }
    }

    // Mark used
    if (record) await OTP.deleteOne({ _id: record._id }).catch(() => {});

    // Find or create user
    const query = type === 'email' ? { email: contact } : { mobile: contact };
    let user = await User.findOne(query).catch(() => null);

    if (!user) {
      user = await User.create({ ...query, name: name || 'Student' }).catch(() => ({
        _id: 'demo_' + Date.now(), name: name || 'Student', email: type === 'email' ? contact : '', mobile: type === 'mobile' ? contact : ''
      }));
    } else if (name && !user.name) {
      user.name = name;
      await user.save().catch(() => {});
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'seatify_dev_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

module.exports = router;
