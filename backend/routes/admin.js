const express = require('express');
const router = express.Router();
const { User, Application, Ticket } = require('../models');
const auth = require('../middleware/auth');
const { google } = require('googleapis');
const path = require('path');

const SHEET_URL = process.env.GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1wQvxrTXlULUTCssHwySjz8G6b-5kwBSYD6wkMx54aSk/export?format=csv';

const extractSheetId = (url) => {
  const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
};

// Middleware: must be authenticated + admin role
const isAdmin = [
  auth,
  (req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    next();
  }
];

router.use(isAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    // Total completed applications
    const completedApps = await Application.find({ paymentStatus: 'completed' });
    const totalAdmissions = completedApps.length;
    
    // Total Revenue (Assuming fee is platform fee per app)
    const totalRevenue = completedApps.reduce((acc, app) => acc + (app.fee || 0), 0);
    
    // Total Students
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    // Active Tickets
    const activeTickets = await Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } });

    // Revenue per day for the chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentApps = await Application.find({ 
      paymentStatus: 'completed',
      createdAt: { $gte: sevenDaysAgo }
    });

    const revenueByDay = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      revenueByDay[d.toISOString().split('T')[0]] = 0;
    }

    recentApps.forEach(app => {
      const dateStr = new Date(app.createdAt).toISOString().split('T')[0];
      if (revenueByDay[dateStr] !== undefined) {
        revenueByDay[dateStr] += (app.fee || 0);
      }
    });

    const revenueChart = Object.keys(revenueByDay).sort().map(date => ({
      date,
      revenue: revenueByDay[date]
    }));

    res.json({
      totalAdmissions,
      totalRevenue,
      totalStudents,
      activeTickets,
      revenueChart
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// GET /api/admin/admissions
router.get('/admissions', async (req, res) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 }).populate('student', 'name email mobile');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admissions' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// POST /api/admin/promote
router.post('/promote', async (req, res) => {
  try {
    const { identifier } = req.body;
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobile: identifier }]
    });
    
    if (!user) return res.status(404).json({ message: 'User not found with that email or mobile' });
    
    user.role = 'admin';
    await user.save();
    res.json({ message: 'User promoted to Admin successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to promote user' });
  }
});

// GET /api/admin/orders-from-sheet
router.get('/orders-from-sheet', async (req, res) => {
  try {
    const sheetId = extractSheetId(SHEET_URL);
    const keyPath = path.join(__dirname, '../google-key.json');
    
    let authClient;
    if (process.env.GOOGLE_PRIVATE_KEY) {
      try {
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        const creds = {
          type: process.env.GOOGLE_TYPE || "service_account",
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: privateKey,
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: process.env.GOOGLE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
          token_uri: process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
          universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || "googleapis.com"
        };

        authClient = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      } catch (err) {
        console.warn('⚠️ Parse GOOGLE_PRIVATE_KEY in admin failed:', err.message);
      }
    }

    if (!authClient && process.env.GOOGLE_CREDS) {
      try {
        const creds = JSON.parse(process.env.GOOGLE_CREDS);
        if (creds.private_key) {
          creds.private_key = creds.private_key.replace(/\\n/g, '\n');
        }
        authClient = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      } catch (parseErr) {
        console.warn('⚠️ Parse GOOGLE_CREDS in admin failed:', parseErr.message);
      }
    }

    if (!authClient && require('fs').existsSync(keyPath)) {
      authClient = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }

    if (sheetId && authClient) {
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Order details!A:Z',
      });

      const rows = response.data.values;
      if (rows && rows.length > 1) {
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        });
        return res.json(data);
      }
    }
    res.json([]);
  } catch (err) {
    console.error('Failed to fetch Orders from Sheet:', err.message);
    res.status(500).json({ message: 'Failed to fetch Orders from Sheet' });
  }
});

module.exports = router;
