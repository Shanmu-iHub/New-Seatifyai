const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const { Application, Course } = require('../models');

let Razorpay;
try { Razorpay = require('razorpay'); } catch {}

const getRazorpayInstance = () => {
  if (!Razorpay || !process.env.RAZORPAY_KEY_ID) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, applicationId } = req.body;
    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      return res.status(503).json({ message: 'Payment gateway not configured' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: applicationId,
      notes: { applicationId },
    });

    // Store order ID
    await Application.findOneAndUpdate(
      { applicationId },
      { razorpayOrderId: order.id }
    ).catch(() => {});

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      title: process.env.RAZORPAY_TITLE || 'Seatifyai',
      description: process.env.RAZORPAY_DESCRIPTION || 'Secure Payment',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payment/verify
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = req.body;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && razorpay_order_id && razorpay_signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment signature verification failed' });
      }
    }

    // Update application
    const application = await Application.findOneAndUpdate(
      { applicationId },
      {
        paymentStatus: 'completed',
        paymentId: razorpay_payment_id,
        status: 'confirmed',
      },
      { new: true }
    ).catch((e) => {
      console.error(`❌ Payment update failed for ${applicationId}:`, e);
      return null;
    });

    if (application) {
      console.log(`✅ Payment verified and application updated: ${applicationId}`);
      
      // Log to Google Sheets (Order Details)
      const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
      if (scriptUrl) {
        try {
          const axios = require('axios');
          await axios.post(scriptUrl, {
            applicationId: application.applicationId,
            studentName: application.fullName,
            email: application.email,
            mobile: application.mobile,
            course: application.courseName,
            program: application.programName,
            fee: application.fee,
            paymentId: razorpay_payment_id,
            date: new Date().toLocaleString('en-IN')
          });
          console.log(`✅ Order details logged to Google Sheets`);
        } catch (sheetErr) {
          console.warn('❌ Google Sheets logging failed:', sheetErr.message);
        }
      }

      // Decrement seat
      try {
        const course = await Course.findById(application.courseId);
        if (course) {
          const prog = course.programs.id(application.programId);
          if (prog && prog.seats > 0) {
            prog.seats = prog.seats - 1;
            await course.save();
          }
        }
      } catch {}

      // Send confirmation email
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SES_SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
          port: Number(process.env.SES_SMTP_PORT || process.env.MAIL_PORT) || 587,
          secure: false,
          auth: { 
            user: process.env.SES_SMTP_USERNAME || process.env.MAIL_USER, 
            pass: process.env.SES_SMTP_PASSWORD || process.env.MAIL_PASS 
          },
        });
        await transporter.sendMail({
          from: process.env.MAIL_FROM || 'Seatifyai <noreply@seatifyai.com>',
          to: application.email,
          subject: `Admission Confirmed — ${application.applicationId}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#1A1A24;border-radius:16px;color:#fff">
              <div style="text-align:center;margin-bottom:24px">
                <div style="width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,0.2);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px">✓</div>
                <h2 style="color:#10B981;margin:0">Admission Confirmed!</h2>
              </div>
              <p>Dear ${application.fullName},</p>
              <p>Your admission has been confirmed for <strong>${application.courseName} — ${application.programName}</strong>.</p>
              <div style="background:#0F0F13;border-radius:12px;padding:16px;margin:20px 0">
                <p><strong>Application ID:</strong> ${application.applicationId}</p>
                <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                <p><strong>Amount Paid:</strong> ₹${application.fee?.toLocaleString('en-IN')}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
              </div>
              <p style="color:#9CA3AF;font-size:13px">Please keep this email for your records. If you have any queries, contact our admissions office.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn('Confirmation email failed:', mailErr.message);
      }
    }

    res.json({ message: 'Payment verified successfully', applicationId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
