const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { Application, Course } = require('../models');
const axios = require('axios');

const GOOGLE_DRIVE_SCRIPT_URL = process.env.GOOGLE_DRIVE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzV93O99qhhcvSKJ_smlu0q70nlD18IuKhQkZj1bkbSfbMDFQg0cP1_MTKut4PJk4in2w/exec';

// Multer setup
let storage;
if (GOOGLE_DRIVE_SCRIPT_URL) {
  storage = multer.memoryStorage();
} else if (process.env.S3_BUCKET) {
  const { S3Client } = require('@aws-sdk/client-s3');
  const multerS3 = require('multer-s3');

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  storage = multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `applications/${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`);
    }
  });
} else {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`);
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only images and PDFs allowed'), ok);
  },
});

const docFields = [
  { name: 'doc_photo', maxCount: 1 },
  { name: 'doc_aadhar', maxCount: 1 },
  { name: 'doc_previousSchoolTC', maxCount: 1 },
  { name: 'doc_marksheet10', maxCount: 1 },
  { name: 'doc_marksheet12', maxCount: 1 },
  { name: 'doc_diplomaCertificate', maxCount: 1 },
  { name: 'doc_tc', maxCount: 1 },
  { name: 'doc_community', maxCount: 1 },
  { name: 'doc_birthCertificate', maxCount: 1 },
  { name: 'doc_admissionForm', maxCount: 1 },
];

// POST /api/applications/:id/cancel
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const app = await Application.findOne({ applicationId: req.params.id, student: req.user._id });
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const previousStatus = app.status;
    app.status = 'cancelled';
    await app.save();

    // Release seat if it was previously confirmed
    if (previousStatus === 'confirmed' || app.paymentStatus === 'completed') {
      try {
        const mongoose = require('mongoose');
        if (mongoose.isValidObjectId(app.courseId)) {
          const course = await Course.findById(app.courseId);
          if (course) {
            const prog = course.programs.id(app.programId);
            if (prog) {
              prog.seats = (prog.seats || 0) + 1;
              await course.save();
              console.log(`✅ Seat released for program: ${app.programName}`);
            }
          }
        }
      } catch (seatErr) {
        console.warn('❌ Failed to release seat:', seatErr.message);
      }
    }

    res.json({ message: 'Admission cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/applications — submit application
router.post('/', auth, upload.fields(docFields), async (req, res) => {
  try {
    const year = new Date().getFullYear();

    // One admission per year check
    const existing = await Application.findOne({
      student: req.user._id,
      academicYear: `${year}-${year + 1}`,
      paymentStatus: 'completed',
      status: { $ne: 'cancelled' }
    });
    if (existing) {
      return res.status(400).json({
        message: 'You already have a confirmed admission for this academic year.',
        applicationId: existing.applicationId,
      });
    }

    // Build docs object
    const docs = {};
    if (req.files) {
      if (GOOGLE_DRIVE_SCRIPT_URL) {
        const filesToUpload = [];
        Object.entries(req.files).forEach(([key, files]) => {
          if (files[0]) {
            filesToUpload.push({
              key: key.replace('doc_', ''),
              name: files[0].originalname,
              mimeType: files[0].mimetype,
              data: files[0].buffer.toString('base64')
            });
          }
        });

        if (filesToUpload.length > 0) {
          try {
            const axios = require('axios');
            const driveRes = await axios.post(GOOGLE_DRIVE_SCRIPT_URL, {
              action: 'uploadFiles',
              studentName: req.body.fullName || 'Unknown Student',
              files: filesToUpload
            });

            if (driveRes.data && driveRes.data.success) {
              Object.assign(docs, driveRes.data.fileUrls);
              docs.driveFolder = driveRes.data.folderUrl || driveRes.data.url || driveRes.data.driveUrl;
            } else {
              // Fallback to local
              Object.entries(req.files).forEach(([key, files]) => {
                const docKey = key.replace('doc_', '');
                if (files[0]) {
                  const ext = path.extname(files[0].originalname);
                  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
                  const filepath = path.join(__dirname, '../uploads', filename);
                  fs.writeFileSync(filepath, files[0].buffer);
                  docs[docKey] = `/uploads/${filename}`;
                }
              });
            }
          } catch (err) {
            console.error('Drive Upload Error:', err.message);
          }
        }
      } else {
        Object.entries(req.files).forEach(([key, files]) => {
          const docKey = key.replace('doc_', '');
          if (files[0]) {
            docs[docKey] = files[0].location || `/uploads/${files[0].filename}`;
          }
        });
      }
    }

    const data = {
      student: req.user._id,
      ...req.body,
      docs,
      folderUrl: docs.driveFolder,
      fee: Number(req.body.fee),
      applicationId: `SEATIFY-${year}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };

    const application = await Application.create(data);
    res.status(201).json({
      applicationId: application.applicationId,
      _id: application._id,
      message: 'Application submitted successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/my — student's applications
router.get('/my', auth, async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const app = await Application.findOne({ applicationId: req.params.id, student: req.user._id });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/applications/:id — update details (within 1 hour only)
router.put('/:id', auth, upload.fields(docFields), async (req, res) => {
  try {
    const app = await Application.findOne({ applicationId: req.params.id, student: req.user._id });
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // 1 hour check
    const createdAt = new Date(app.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    if (hoursDiff > 1) {
      return res.status(400).json({
        message: 'You can only edit details within 1 hour of placing your order.'
      });
    }

    if (app.isEdited) {
      return res.status(400).json({
        message: 'You have already edited your details once. Further edits are not allowed.'
      });
    }

    // Handle Document Updates
    let updatedDocs = { ...(app.docs || {}) };
    if (req.files && Object.keys(req.files).length > 0) {
      if (GOOGLE_DRIVE_SCRIPT_URL) {
        const filesToUpload = [];
        Object.entries(req.files).forEach(([key, files]) => {
          if (files[0]) {
            filesToUpload.push({
              key: key.replace('doc_', ''),
              name: files[0].originalname,
              mimeType: files[0].mimetype,
              data: files[0].buffer.toString('base64')
            });
          }
        });

        if (filesToUpload.length > 0) {
          try {
            const driveRes = await axios.post(GOOGLE_DRIVE_SCRIPT_URL, {
              action: 'uploadFiles',
              studentName: req.body.fullName || app.fullName,
              files: filesToUpload
            });
            if (driveRes.data && driveRes.data.success) {
              Object.assign(updatedDocs, driveRes.data.fileUrls);
              if (driveRes.data.folderUrl) updatedDocs.driveFolder = driveRes.data.folderUrl;
            }
          } catch (driveErr) {
            console.error('Drive Edit Upload Failed:', driveErr.message);
          }
        }
      } else {
        Object.entries(req.files).forEach(([key, files]) => {
          const docKey = key.replace('doc_', '');
          if (files[0]) {
            const ext = path.extname(files[0].originalname);
            const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
            const filepath = path.join(__dirname, '../uploads', filename);
            if (files[0].buffer) fs.writeFileSync(filepath, files[0].buffer);
            updatedDocs[docKey] = `/uploads/${filename}`;
          }
        });
      }
    }

    // Use findOneAndUpdate for absolute consistency
    const updatedApp = await Application.findOneAndUpdate(
      { applicationId: req.params.id, student: req.user._id },
      { 
        $set: { 
          fullName: req.body.fullName || app.fullName,
          dob: req.body.dob || app.dob,
          admissionType: req.body.admissionType || app.admissionType,
          email: req.body.email || app.email,
          mobile: req.body.mobile || app.mobile,
          community: req.body.community || app.community,
          parentName: req.body.parentName || app.parentName,
          parentOccupation: req.body.parentOccupation || app.parentOccupation,
          parentMobile: req.body.parentMobile || app.parentMobile,
          homeTown: req.body.homeTown || app.homeTown,
          district: req.body.district || app.district,
          districtOther: req.body.districtOther || app.districtOther,
          currentQualification: req.body.currentQualification || app.currentQualification,
          aadhar: req.body.aadhar || app.aadhar,
          physicalApplicationNo: req.body.physicalApplicationNo || app.physicalApplicationNo,
          docs: updatedDocs,
          isEdited: true 
        } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedApp) return res.status(404).json({ message: 'Application lost during update' });

    res.json({
      message: 'Details updated successfully',
      application: updatedApp
    });
  } catch (err) {
    console.error('Edit Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/applications/:id/documents — append pending documents atomically
router.post('/:id/documents', auth, upload.fields(docFields), async (req, res) => {
  try {
    const app = await Application.findOne({ applicationId: req.params.id, student: req.user._id });
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const setQuery = {};
    if (req.files && Object.keys(req.files).length > 0) {
      if (GOOGLE_DRIVE_SCRIPT_URL) {
        const filesToUpload = [];
        Object.entries(req.files).forEach(([key, files]) => {
          if (files[0]) {
            filesToUpload.push({
              key: key.replace('doc_', ''),
              name: files[0].originalname,
              mimeType: files[0].mimetype,
              data: files[0].buffer.toString('base64')
            });
          }
        });

        if (filesToUpload.length > 0) {
          try {
            const driveRes = await axios.post(GOOGLE_DRIVE_SCRIPT_URL, {
              action: 'uploadFiles',
              studentName: app.fullName || 'Student',
              files: filesToUpload
            });
            if (driveRes.data && driveRes.data.success) {
              Object.entries(driveRes.data.fileUrls).forEach(([docKey, fileUrl]) => {
                setQuery[`docs.${docKey}`] = fileUrl;
              });
              if (driveRes.data.folderUrl) {
                setQuery['docs.driveFolder'] = driveRes.data.folderUrl;
                setQuery['folderUrl'] = driveRes.data.folderUrl;
              }
            } else {
              // Fallback to local
              Object.entries(req.files).forEach(([key, files]) => {
                const docKey = key.replace('doc_', '');
                if (files[0]) {
                  const ext = path.extname(files[0].originalname);
                  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
                  const filepath = path.join(__dirname, '../uploads', filename);
                  if (files[0].buffer) fs.writeFileSync(filepath, files[0].buffer);
                  setQuery[`docs.${docKey}`] = `/uploads/${filename}`;
                }
              });
            }
          } catch (driveErr) {
            console.error('Drive Edit Upload Failed:', driveErr.message);
            // Fallback to local
            Object.entries(req.files).forEach(([key, files]) => {
              const docKey = key.replace('doc_', '');
              if (files[0]) {
                const ext = path.extname(files[0].originalname);
                const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
                const filepath = path.join(__dirname, '../uploads', filename);
                if (files[0].buffer) fs.writeFileSync(filepath, files[0].buffer);
                setQuery[`docs.${docKey}`] = `/uploads/${filename}`;
              }
            });
          }
        }
      } else {
        Object.entries(req.files).forEach(([key, files]) => {
          const docKey = key.replace('doc_', '');
          if (files[0]) {
            const ext = path.extname(files[0].originalname);
            const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
            const filepath = path.join(__dirname, '../uploads', filename);
            if (files[0].buffer) fs.writeFileSync(filepath, files[0].buffer);
            setQuery[`docs.${docKey}`] = `/uploads/${filename}`;
          }
        });
      }
    }

    if (Object.keys(setQuery).length > 0) {
      const updatedApp = await Application.findOneAndUpdate(
        { applicationId: req.params.id, student: req.user._id },
        { $set: setQuery },
        { new: true }
      );
      if (!updatedApp) return res.status(404).json({ message: 'Application lost during update' });
      res.json({ message: 'Documents uploaded successfully', application: updatedApp });
    } else {
      res.json({ message: 'No documents uploaded', application: app });
    }
  } catch (err) {
    console.error('Document Upload Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/applications/:id/documents/:docKey — delete a single document atomically
router.delete('/:id/documents/:docKey', auth, async (req, res) => {
  try {
    const updatedApp = await Application.findOneAndUpdate(
      { applicationId: req.params.id, student: req.user._id },
      { $unset: { [`docs.${req.params.docKey}`]: 1 } },
      { new: true }
    );
    if (!updatedApp) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Document removed successfully', application: updatedApp });
  } catch (err) {
    console.error('Document Remove Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
