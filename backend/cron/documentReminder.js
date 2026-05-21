const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { Application } = require('../models');

// Document requirements helper
const getDocumentRequirements = (courseName, category) => {
  if (!courseName) return [];
  const docs = [
    { id: 'aadhar', label: 'Aadhar Card *' },
    { id: 'birthCertificate', label: 'Birth Certificate' },
    { id: 'community', label: 'Community Certificate' },
  ];

  const name = courseName.toLowerCase();

  if (category === 'K-12') {
    if (name.includes('grade 11') || name.includes('grade 12')) {
      docs.push({ id: 'marksheet10', label: '10th Mark Sheet' });
      docs.push({ id: 'previousSchoolTC', label: 'Transfer Certificate (TC)' });
    } else if (!name.includes('pre kg')) {
      docs.push({ id: 'previousSchoolTC', label: 'Transfer Certificate (TC)' });
    }
  } else {
    docs.push({ id: 'marksheet10', label: '10th Mark Sheet' });
    docs.push({ id: 'marksheet12', label: '12th Mark Sheet / Diploma Certificate' });
  }
  docs.push({ id: 'admissionForm', label: 'Admission Form' });

  return docs;
};

const sendReminderEmails = async () => {
  console.log('[Cron] Checking for pending documents...');
  try {
    const apps = await Application.find({ status: { $nin: ['cancelled', 'rejected'] } });

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

    const now = new Date();

    for (const app of apps) {
      // Calculate missing docs
      const requiredDocs = getDocumentRequirements(app.courseName, app.category);
      const uploadedDocs = app.docs || {};
      const missingDocs = requiredDocs.filter(d => !uploadedDocs[d.id]);

      if (missingDocs.length > 0) {
        // Check if 2 days have passed since creation
        const daysSinceCreation = Math.floor((now - app.createdAt) / (1000 * 60 * 60 * 24));

        // Check if it's a multiple of 2 days (e.g. 2, 4, 6...)
        // To avoid spamming, we could also track lastReminderSentAt, but for simplicity we'll just check modulo
        if (daysSinceCreation > 0 && daysSinceCreation % 2 === 0) {
          console.log(`[Cron] Sending reminder to ${app.email} for application ${app.applicationId}`);

          const missingListHtml = missingDocs.map(d => `<li>${d.label}</li>`).join('');

          try {
            await transporter.sendMail({
              from: process.env.MAIL_FROM || 'Seatifyai <noreply@seatifyai.com>',
              to: app.email,
              subject: `Action Required: Pending Documents for Admission (${app.applicationId})`,
              html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                  <h2 style="color: #4F46E5;">Pending Documents Reminder</h2>
                  <p>Dear ${app.fullName || 'Student'},</p>
                  <p>This is a gentle reminder that your admission application for <strong>${app.courseName} - ${app.programName}</strong> is missing some required documents.</p>
                  <p>Please login to your Seatify profile and navigate to the <strong>Pending Documents</strong> tab to upload the following:</p>
                  <ul style="color: #EF4444; font-weight: bold;">
                    ${missingListHtml}
                  </ul>
                  <p style="margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                      Go to Profile
                    </a>
                  </p>
                  <p style="margin-top: 30px; font-size: 12px; color: #777;">
                    If you have already uploaded these documents, please ignore this email.
                  </p>
                </div>
              `
            });
          } catch (err) {
            console.error(`[Cron] Failed to send email to ${app.email}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Error checking pending documents:', err);
  }
};

// Schedule to run every day at 10:00 AM
cron.schedule('0 10 * * *', () => {
  sendReminderEmails();
});

module.exports = { sendReminderEmails };
