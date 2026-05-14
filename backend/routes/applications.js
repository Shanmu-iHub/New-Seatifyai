const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { Application } = require('../models');

// Multer setup
let storage;
if (process.env.S3_BUCKET) {
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
    acl: 'public-read',
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
  { name: 'doc_marksheet10', maxCount: 1 },
  { name: 'doc_marksheet12', maxCount: 1 },
  { name: 'doc_tc', maxCount: 1 },
  { name: 'doc_community', maxCount: 1 },
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
      Object.entries(req.files).forEach(([key, files]) => {
        const docKey = key.replace('doc_', '');
        if (files[0]) {
          docs[docKey] = files[0].location || `/uploads/${files[0].filename}`;
        }
      });
    }

    const data = {
      student: req.user._id,
      ...req.body,
      docs,
      fee: Number(req.body.fee),
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

module.exports = router;
