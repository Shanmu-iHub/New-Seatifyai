const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { Application } = require('../models');

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
];

// POST /api/applications — submit application
router.post('/', auth, upload.fields(docFields), async (req, res) => {
  try {
    const year = new Date().getFullYear();

    // One admission per year check
    const existing = await Application.findOne({
      student: req.user._id,
      academicYear: `${year}-${year + 1}`,
      paymentStatus: 'completed',
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
              docs.driveFolder = driveRes.data.folderUrl;
            } else {
              console.error('Google Drive Upload Failed:', driveRes.data.error || 'Unknown error');
              console.log('Falling back to local storage');
              // Fallback to local storage - write files from memory to disk
              const uploadDir = path.join(__dirname, '../uploads');
              if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
              
              Object.entries(req.files).forEach(([key, files]) => {
                const docKey = key.replace('doc_', '');
                if (files[0]) {
                  const ext = path.extname(files[0].originalname);
                  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
                  const filepath = path.join(uploadDir, filename);
                  fs.writeFileSync(filepath, files[0].buffer);
                  docs[docKey] = `/uploads/${filename}`;
                }
              });
            }
          } catch (err) {
            console.error('Google Drive Upload Error:', err.message);
            console.log('Falling back to local storage');
            // Fallback to local storage - write files from memory to disk
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            
            Object.entries(req.files).forEach(([key, files]) => {
              const docKey = key.replace('doc_', '');
              if (files[0]) {
                const ext = path.extname(files[0].originalname);
                const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, files[0].buffer);
                docs[docKey] = `/uploads/${filename}`;
              }
            });
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
      fee: Number(req.body.fee),
    };

    const application = await Application.create(data);
    console.log(`✅ Application created: ${application.applicationId} for student ${req.user._id}`);
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

// PUT /api/applications/:id — update personal details (within 1 hour only)
router.put('/:id', auth, async (req, res) => {
  try {
    const app = await Application.findOne({ applicationId: req.params.id, student: req.user._id });
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Check if within 1 hour of creation
    const createdAt = new Date(app.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    if (hoursDiff > 1) {
      return res.status(400).json({ 
        message: 'You can only edit personal details within 1 hour of placing your order.' 
      });
    }

    // Only allow updating personal details (not course-related fields)
    const allowedFields = ['fullName', 'dob', 'admissionType', 'email', 'mobile'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Prevent course-related fields from being updated
    const protectedFields = ['courseId', 'courseName', 'programId', 'programName', 'fee', 'docs', 'paymentStatus', 'status'];
    const attemptedProtectedUpdates = protectedFields.filter(field => req.body[field] !== undefined);
    if (attemptedProtectedUpdates.length > 0) {
      return res.status(400).json({ 
        message: 'Course details cannot be modified. Only personal details can be edited.' 
      });
    }

    Object.assign(app, updates);
    await app.save();

    res.json({ 
      message: 'Personal details updated successfully',
      application: app
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
