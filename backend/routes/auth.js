const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OTP, User } = require('../models');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Email transporter
const getTransporter = () => nodemailer.createTransport({
  host: process.env.SES_SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.SES_SMTP_PORT || process.env.MAIL_PORT) || 587,
  secure: false,
  auth: { 
    user: process.env.SES_SMTP_USERNAME || process.env.MAIL_USER, 
    pass: process.env.SES_SMTP_PASSWORD || process.env.MAIL_PASS 
  },
});

const sendEmailOTP = async (email, otp) => {
  const transporter = getTransporter();
  await transporter.sendMail({
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
  });
};

const sendSMSOTP = async (mobile, otp) => {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS OTP] ${mobile}: ${otp}`);
    return;
  }
  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await twilio.messages.create({
    body: `Your Seatifyai OTP is: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE,
    to: mobile,
  });
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
      if (type === 'email') await sendEmailOTP(contact, otp);
      else await sendSMSOTP(contact, otp);
    } catch (mailErr) {
      console.warn('OTP send failed (using console fallback):', mailErr.message);
      console.log(`[DEV OTP] ${contact}: ${otp}`);
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

    // Find valid OTP
    const record = await OTP.findOne({
      contact, type, otp,
      expiresAt: { $gt: new Date() }
    }).catch(() => null);

    // Dev bypass: accept '123456' for testing
    const isDevMode = otp === '123456' && process.env.NODE_ENV !== 'production';

    if (!record && !isDevMode)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

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
