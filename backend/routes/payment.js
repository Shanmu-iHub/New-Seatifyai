const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const { Application, Course } = require('../models');

let Razorpay;
try { Razorpay = require('razorpay'); } catch { }

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

    const application = await Application.findOne({ applicationId });
    
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: applicationId,
      notes: { 
        applicationId,
        collegeName: application?.collegeName || 'N/A'
      },
    });

    // Store order ID
    await Application.findOneAndUpdate(
      { applicationId },
      { razorpayOrderId: order.id, fee: amount }
    ).catch(() => { });

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

      const scriptUrl = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzV93O99qhhcvSKJ_smlu0q70nlD18IuKhQkZj1bkbSfbMDFQg0cP1_MTKut4PJk4in2w/exec';
      if (scriptUrl) {
        try {
          const axios = require('axios');
          const sheetRes = await axios.post(scriptUrl, {
            applicationId: application.applicationId,
            studentName: application.fullName,
            email: application.email,
            mobile: application.mobile,
            course: application.courseName,
            program: application.programName,
            college: application.collegeName,
            collegeName: application.collegeName,
            fee: application.fee,
            paymentId: razorpay_payment_id,
            folderUrl: application.folderUrl || '',
            documentUrl: application.folderUrl || '',
            driveFolder: application.folderUrl || '',
            marksheet10: application.docs?.marksheet10 || '',
            marksheet12: application.docs?.marksheet12 || '',
            aadhaar: application.docs?.aadhar || '',
            tc: application.docs?.previousSchoolTC || application.docs?.tc || '',
            community: application.docs?.community || '',
            date: new Date(application.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          });
          console.log(`✅ Google Sheet Response:`, sheetRes.data);
          console.log(`✅ Order details logged and seat sync triggered`);
        } catch (sheetErr) {
          console.warn('❌ Google Sheets sync failed:', sheetErr.message);
        }
      }

      try {
        const mongoose = require('mongoose');
        if (mongoose.isValidObjectId(application.courseId)) {
          const course = await Course.findById(application.courseId);
          if (course) {
            const prog = course.programs.id(application.programId);
            if (prog && prog.seats > 0) {
              prog.seats = prog.seats - 1;
              await course.save();
            }
          }
        }
      } catch { }

      // Send confirmation email
      try {
        const nodemailer = require('nodemailer');
        const port = Number(process.env.SES_SMTP_PORT || process.env.MAIL_PORT) || 587;
        const secure = process.env.MAIL_SECURE !== undefined ? process.env.MAIL_SECURE === 'true' : port === 465;
        const transporter = nodemailer.createTransport({
          host: process.env.SES_SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
          port: port,
          secure: secure,
          auth: {
            user: process.env.SES_SMTP_USERNAME || process.env.MAIL_USER,
            pass: process.env.SES_SMTP_PASSWORD || process.env.MAIL_PASS
          },
          tls: { rejectUnauthorized: false }
        });
        await transporter.sendMail({
          from: process.env.MAIL_FROM || 'Seatifyai <noreply@seatifyai.com>',
          to: application.email,
          subject: `Admission Confirmed — ${application.applicationId}`,
          html: `
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 20px 10px;">
              <tr>
                <td align="center">
                  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; max-width: 600px; background-color: #1a1d24; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <div style="padding: 40px 20px 20px; text-align: center; background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(26, 29, 36, 0) 100%);">
                      <div style="width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">
                        <span style="font-size: 32px; color: #ffffff;">✓</span>
                      </div>
                      <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #10b981; letter-spacing: -0.02em;">Admission Confirmed!</h1>
                      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Your seat has been successfully reserved.</p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 20px 24px;">
                      <p style="font-size: 16px; margin-bottom: 20px; font-weight: 500;">Dear ${application.fullName},</p>
                      <p style="line-height: 1.6; color: #e2e8f0; margin-bottom: 30px; font-size: 15px;">
                        Congratulations! Your admission has been confirmed for <strong>${application.courseName} — ${application.programName}</strong> at <strong>${application.collegeName || 'Seatifyai Institute'}</strong>.
                      </p>

                      <!-- Order Summary Box -->
                      <div style="background-color: #0a0a0a; border-radius: 14px; padding: 24px; border: 1px solid #1e293b;">
                        <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.05em;">Enrollment Details</h3>
                        
                        <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 0 12px;">
                          <div style="display: table-row;">
                            <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px; width: 40%;">Application ID</div>
                            <div style="display: table-cell; font-size: 14px; color: #f8fafc; font-weight: 600;">${application.applicationId}</div>
                          </div>
                          <div style="display: table-row;">
                            <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px;">Institution</div>
                            <div style="display: table-cell; font-size: 14px; color: #f8fafc; font-weight: 500;">${application.collegeName || 'Seatifyai Institute'}</div>
                          </div>
                          <div style="display: table-row;">
                            <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px;">Course & Program</div>
                            <div style="display: table-cell; font-size: 14px; color: #f8fafc; font-weight: 500;">${application.courseName} — ${application.programName}</div>
                          </div>
                          <div style="display: table-row;">
                            <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px;">Payment ID</div>
                            <div style="display: table-cell; font-size: 14px; color: #6366f1; font-weight: 600; font-family: monospace;">${razorpay_payment_id}</div>
                          </div>
                          <div style="display: table-row;">
                            <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px;">Amount Paid</div>
                            <div style="display: table-cell; font-size: 16px; color: #10b981; font-weight: 700;">₹${application.fee?.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-top: 30px; text-align: center;">
                        <a href="https://seatifyai.com/profile" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">View Admission Profile</a>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 32px 24px; background-color: #1e293b; text-align: center;">
                      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
                        This is an automated confirmation of your admission. Please keep this email for your records. If you have any questions, feel free to contact our support team.
                      </p>
                      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(148, 163, 184, 0.1);">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Seatifyai. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
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
