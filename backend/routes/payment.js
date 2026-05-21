const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const { Application, Course, CollegeAccount, SettlementLedger } = require('../models');

let Razorpay;
try { Razorpay = require('razorpay'); } catch { }

const getRazorpayInstance = () => {
  if (!Razorpay || !process.env.RAZORPAY_KEY_ID) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const hasAcceptedPolicy = (application) => Boolean(application?.policyAcceptance?.accepted);

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, applicationId } = req.body;
    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      return res.status(503).json({ message: 'Payment gateway not configured' });
    }

    const application = await Application.findOne({ applicationId });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (['cancelled', 'rejected'].includes(application.status)) {
      return res.status(400).json({ message: 'This application is not active and cannot be paid.' });
    }

    const activeConfirmed = await Application.findOne({
      student: application.student,
      academicYear: application.academicYear,
      paymentStatus: 'completed',
      status: { $nin: ['cancelled', 'rejected'] },
      applicationId: { $ne: applicationId }
    });
    if (activeConfirmed) {
      return res.status(400).json({ message: 'You already have a confirmed admission for this academic year.' });
    }

    if (!hasAcceptedPolicy(application)) {
      return res.status(400).json({
        success: false,
        message: 'Policy acceptance is required before proceeding.'
      });
    }

    if (application.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Payment already completed for this application' });
    }

    const orderPayload = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: applicationId,
      notes: { 
        applicationId,
        collegeName: application.collegeName || 'N/A'
      },
    };

    // Split Payment Configuration (Razorpay Route)
    if (application.collegeName) {
      const collegeAcc = await CollegeAccount.findOne({ 
        collegeName: application.collegeName,
        active: true
      });

      if (collegeAcc && collegeAcc.payoutMode === 'razorpay_route' && collegeAcc.razorpayAccountId) {
        // Calculate Pre-registration base fee (amount minus Platform fee & GST)
        // 1 INR Platform Fee + 0.18 INR GST = 1.18 INR Platform Cost
        const baseFee = amount > 1.18 ? (amount - 1.18) : amount;
        
        orderPayload.transfers = [
          {
            account: collegeAcc.razorpayAccountId,
            amount: Math.round(baseFee * 100), // in paise
            currency: 'INR',
            notes: {
              info: `Pre-Registration Fee for ${application.collegeName}`,
              applicationId
            },
            on_hold: false
          }
        ];
        console.log(`🔀 Configuring payment split of ₹${baseFee} to Razorpay Connected Account ID: ${collegeAcc.razorpayAccountId}`);
      } else if (collegeAcc) {
        console.log(`ℹ️ College "${application.collegeName}" payout method is set to "${collegeAcc.payoutMode}". 100% of funds collected to primary account first, then settled via payout engine.`);
      } else {
        console.log(`ℹ️ No active Razorpay Linked Account mapping found for college: "${application.collegeName}". 100% of payment goes to Primary account.`);
      }
    }

    const order = await razorpay.orders.create(orderPayload);

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
    const existingApplication = await Application.findOne({ applicationId });

    if (!existingApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!hasAcceptedPolicy(existingApplication)) {
      return res.status(400).json({
        success: false,
        message: 'Policy acceptance is required before proceeding.'
      });
    }

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

      // Settlement Ledger Entry (Swiggy/Zepto Ledger Model)
      try {
        const collegeAcc = await CollegeAccount.findOne({ 
          collegeName: application.collegeName, 
          active: true 
        });
        const platformFee = 1.18; // Platform Fee (₹1) + GST (₹0.18)
        const totalAmount = application.fee || 0;
        const collegeShare = totalAmount > platformFee ? (totalAmount - platformFee) : totalAmount;
        const payoutMode = collegeAcc?.payoutMode || 'direct_bank';

        // Only create ledger for non-razorpay_route modes (Route splits are instant at gateway)
        // For razorpay_route, mark as already settled
        const settlementStatus = payoutMode === 'razorpay_route' ? 'settled' : 'pending';

        await SettlementLedger.findOneAndUpdate(
          { applicationId: application.applicationId },
          {
            collegeName: application.collegeName || 'Unknown',
            studentName: application.fullName || 'Unknown',
            totalAmount,
            platformFee,
            collegeShare,
            payoutMode,
            settlementStatus,
            settledAt: payoutMode === 'razorpay_route' ? new Date() : null
          },
          { upsert: true, new: true }
        );
        console.log(`📒 Settlement ledger entry created: ₹${collegeShare} → ${application.collegeName} (${payoutMode}, ${settlementStatus})`);
      } catch (ledgerErr) {
        console.warn('⚠️ Settlement ledger entry failed:', ledgerErr.message);
      }

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
            community: application.community || application.docs?.community || '',
            parentName: application.parentName || '',
            parentOccupation: application.parentOccupation || '',
            parentMobile: application.parentMobile || '',
            homeTown: application.homeTown || '',
            district: application.district === 'Other' ? (application.districtOther || '') : (application.district || ''),
            currentQualification: application.currentQualification || '',
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
                      <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; text-align: center; background-color: #10b981; border-radius: 50%; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); font-size: 32px; color: #ffffff; font-weight: bold;">✓</div>
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
