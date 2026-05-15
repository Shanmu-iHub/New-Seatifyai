const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    /https?:\/\/.*\.?seatifyai\.com$/,
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/students', require('./routes/students'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/api/test-cancel', (req, res) => res.json({ message: 'Cancel route is reachable' }));

app.post('/api/cancel/:id', async (req, res) => {
  const { Application } = require('./models');
  try {
    const app = await Application.findOne({ applicationId: req.params.id });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = 'cancelled';
    await app.save();

    // Release seat in DB
    try {
      const { Course } = require('./models');
      const mongoose = require('mongoose');
      if (mongoose.isValidObjectId(app.courseId)) {
        const course = await Course.findById(app.courseId);
        if (course) {
          const prog = course.programs.id(app.programId);
          if (prog) {
            prog.seats = (prog.seats || 0) + 1;
            await course.save();
            console.log(`✅ Seat released for ${app.courseName} — ${app.programName}`);
          }
        }
      }
    } catch (seatErr) {
      console.error('❌ Failed to release seat:', seatErr.message);
    }
    // Send cancellation email
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
        to: app.email,
        subject: `Admission Cancelled — ${app.applicationId}`,
        html: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 20px 10px;">
            <tr>
              <td align="center">
                <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; max-width: 600px; background-color: #1a1d24; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
                  <!-- Header -->
                  <div style="padding: 40px 20px 20px; text-align: center; background: linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(26, 29, 36, 0) 100%);">
                    <div style="width: 64px; height: 64px; background-color: #ef4444; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);">
                      <span style="font-size: 32px; color: #ffffff;">✕</span>
                    </div>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ef4444; letter-spacing: -0.02em;">Admission Cancelled</h1>
                    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">The application has been successfully cancelled.</p>
                  </div>

                  <!-- Body -->
                  <div style="padding: 20px 24px;">
                    <p style="font-size: 16px; margin-bottom: 20px; font-weight: 500;">Dear ${app.fullName},</p>
                    <p style="line-height: 1.6; color: #e2e8f0; margin-bottom: 30px; font-size: 15px;">
                      Your admission has been cancelled for <strong>${app.courseName} — ${app.programName}</strong> at <strong>${app.collegeName || 'Seatifyai Institute'}</strong>.
                    </p>

                    <!-- Summary Box -->
                    <div style="background-color: #0a0a0a; border-radius: 14px; padding: 24px; border: 1px solid #1e293b;">
                      <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.05em;">Cancellation Summary</h3>
                      
                      <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 0 12px;">
                        <div style="display: table-row;">
                          <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px; width: 40%;">Application ID</div>
                          <div style="display: table-cell; font-size: 14px; color: #f8fafc; font-weight: 600;">${app.applicationId}</div>
                        </div>
                        <div style="display: table-row;">
                          <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px;">Institution</div>
                          <div style="display: table-cell; font-size: 14px; color: #f8fafc;">${app.collegeName || 'Seatifyai Institute'}</div>
                        </div>
                        <div style="display: table-row;">
                          <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px;">Course Name</div>
                          <div style="display: table-cell; font-size: 14px; color: #f8fafc;">${app.courseName}</div>
                        </div>
                        <div style="display: table-row;">
                          <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px;">Program Name</div>
                          <div style="display: table-cell; font-size: 14px; color: #f8fafc;">${app.programName}</div>
                        </div>
                        <div style="display: table-row;">
                          <div style="display: table-cell; font-size: 14px; color: #94a3b8; padding-right: 12px;">Cancellation Date</div>
                          <div style="display: table-cell; font-size: 14px; color: #f8fafc;">${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div style="padding: 32px 24px; background-color: #1e293b; text-align: center;">
                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
                      If this cancellation was not authorized by you, or if you have questions regarding refunds, please contact our admissions office immediately.
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
      console.log(`✅ Cancellation email sent to: ${app.email}`);
    } catch (mailErr) {
      console.warn('❌ Cancellation email failed:', mailErr.message);
    }

    res.json({ message: 'Admission cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Connect DB — runs immediately (works in both serverless and traditional server)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seatifyai')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));

// Only bind a port when NOT running on Vercel (local dev or VPS)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Seatifyai server running on port ${PORT}`));
}

module.exports = app;
