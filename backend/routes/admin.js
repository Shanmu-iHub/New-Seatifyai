const express = require('express');
const router = express.Router();
const { User, Application, Ticket, Course, CollegeAccount, SettlementLedger } = require('../models');
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
    const allApps = await Application.find().populate('student', 'name email mobile').sort({ createdAt: -1 });
    const completedApps = allApps.filter(a => a.paymentStatus === 'completed');
    const pendingApps = allApps.filter(a => a.paymentStatus === 'pending');
    const cancelledApps = allApps.filter(a => a.status === 'cancelled');
    const confirmedApps = allApps.filter(a => a.status === 'confirmed');

    // === KPI Cards ===
    const totalAdmissions = completedApps.length;
    const totalRevenue = completedApps.reduce((acc, app) => acc + (app.fee || 0), 0);
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeTickets = await Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } });

    // === Admission Funnel ===
    const admissionFunnel = [
      { stage: 'Registered', count: totalStudents, fill: '#6366f1' },
      { stage: 'Applied', count: allApps.length, fill: '#8b5cf6' },
      { stage: 'Payment Done', count: completedApps.length, fill: '#10b981' },
      { stage: 'Confirmed', count: confirmedApps.length, fill: '#059669' },
      { stage: 'Cancelled', count: cancelledApps.length, fill: '#f43f5e' },
    ];

    // === College-wise Admissions (Bar) ===
    // Smart abbreviation: remove filler words, abbreviate remaining
    const abbreviate = (name) => {
      const fillers = new Set(['college', 'of', 'the', 'and', '&', 'for', 'a', 'an', 'in']);
      const words = name.split(/\s+/).filter(w => w.length > 0);
      const meaningful = words.filter(w => !fillers.has(w.toLowerCase()));
      if (meaningful.length === 0) return name.slice(0, 10);
      // If 4+ meaningful words → initials of all
      if (meaningful.length >= 4) {
        return meaningful.map(w => w[0].toUpperCase()).join('');
      }
      // 2–3 meaningful words → keep first word full + shorten rest
      return meaningful.map((w, i) => i === 0 ? w : w.slice(0, 4)).join(' ');
    };

    const collegeMap = {};
    completedApps.forEach(app => {
      const cn = app.collegeName || 'Unknown';
      collegeMap[cn] = (collegeMap[cn] || 0) + 1;
    });
    const collegeAdmissions = Object.entries(collegeMap)
      .map(([college, count]) => ({ college, short: abbreviate(college), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // === Course-wise Seat Availability (Bar) ===
    const courseSeatMap = {};
    completedApps.forEach(app => {
      const cName = app.courseName || app.programName || 'Unknown Course';
      courseSeatMap[cName] = (courseSeatMap[cName] || 0) + 1;
    });
    
    const abbreviateCourse = (name) => {
      const known = {
        'Electronics & Communication Engineering': 'ECE',
        'Computer Science and Engineering': 'CSE',
        'Computer Science (AI, ML & DS)': 'CS (AIML)',
        'Mechanical Engineering': 'MECH',
        'Information Technology': 'IT',
        'Artificial Intelligence & Data Science': 'AIDS',
        'AI and Data Science': 'AIDS',
        'Internet of Things': 'IOT',
        'Master of Business Administration': 'MBA',
        'Master of Computer Application': 'MCA',
        'Electrical & Electronics Engineering': 'EEE',
        'Civil Engineering': 'CIVIL',
        'Bachelor of Physiotherapy (BPT)': 'BPT',
        'Doctor of Pharmacy (Pharm.D)': 'Pharm.D',
        'Bachelor of Pharmacy': 'B.Pharm',
        'Generative AI': 'GenAI',
        'Agentic AI': 'Agentic AI'
      };
      if (known[name]) return known[name];
      
      // Fallback: initials for multiple words
      const fillers = new Set(['of', 'the', 'and', '&', 'for', 'in', 'and']);
      const words = name.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
      const meaningful = words.filter(w => !fillers.has(w.toLowerCase()));
      if (meaningful.length > 1) return meaningful.map(w => w[0].toUpperCase()).join('');
      return name.slice(0, 8);
    };

    const courseSeats = Object.entries(courseSeatMap).map(([name, filled]) => {
      const total = 60; // Default capacity assumption for UI scale
      return {
        name,
        short: abbreviateCourse(name),
        filled,
        available: Math.max(0, total - filled),
        total
      };
    });
    const courseSeatChart = courseSeats.sort((a, b) => b.filled - a.filled).slice(0, 8);

    // === Revenue per day (last 14 days) ===
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const revenueByDay = {};
    const admissionsByDay = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split('T')[0];
      revenueByDay[key] = 0;
      admissionsByDay[key] = 0;
    }
    completedApps.forEach(app => {
      const dateStr = new Date(app.createdAt).toISOString().split('T')[0];
      if (revenueByDay[dateStr] !== undefined) {
        revenueByDay[dateStr] += (app.fee || 0);
        admissionsByDay[dateStr] += 1;
      }
    });
    const revenueChart = Object.keys(revenueByDay).sort().map(date => ({
      date: date.slice(5), // MM-DD
      revenue: revenueByDay[date],
      admissions: admissionsByDay[date]
    }));

    // === Real-Time Activity Feed (last 10 events) ===
    const recentActivity = allApps.slice(0, 10).map(app => ({
      id: app._id,
      applicationId: app.applicationId,
      studentName: app.student?.name || app.fullName || 'Unknown',
      college: app.collegeName || '—',
      program: app.programName || app.program || '—',
      status: app.status,
      paymentStatus: app.paymentStatus,
      fee: app.fee || 0,
      createdAt: app.createdAt
    }));

    // === Payment method breakdown ===
    const paymentBreakdown = [
      { name: 'Completed', value: completedApps.length, fill: '#10b981' },
      { name: 'Pending', value: pendingApps.length, fill: '#f59e0b' },
      { name: 'Cancelled', value: cancelledApps.length, fill: '#f43f5e' },
    ];

    res.json({
      totalAdmissions,
      totalRevenue,
      totalStudents,
      activeTickets,
      admissionFunnel,
      collegeAdmissions,
      courseSeatChart,
      revenueChart,
      recentActivity,
      paymentBreakdown,
      platformRevenue: totalRevenue,
      pendingCount: pendingApps.length,
    });
  } catch (err) {
    console.error('Stats error:', err);
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

// GET /api/admin/orders — Orders from MongoDB
router.get('/orders', async (req, res) => {
  try {
    const apps = await Application.find({ paymentStatus: 'completed' })
      .sort({ createdAt: -1 })
      .populate('student', 'name email mobile');

    const orders = apps.map(a => ({
      applicationId: a.applicationId,
      studentName: a.student?.name || a.fullName || '—',
      email: a.student?.email || a.email || '—',
      mobile: a.student?.mobile || a.mobile || '—',
      college: a.collegeName || '—',
      course: a.courseName || '—',
      program: a.programName || '—',
      category: a.category || '—',
      fee: a.fee || 0,
      paymentStatus: a.paymentStatus,
      paymentId: a.paymentId || '—',
      status: a.status,
      date: a.createdAt
    }));

    res.json(orders);
  } catch (err) {
    console.error('Failed to fetch orders:', err.message);
    res.status(500).json({ message: 'Failed to fetch orders' });
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

// GET /api/admin/college-accounts
router.get('/college-accounts', isAdmin, async (req, res) => {
  try {
    const accounts = await CollegeAccount.find({});
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/college-accounts
router.post('/college-accounts', isAdmin, async (req, res) => {
  try {
    const { 
      collegeName, 
      payoutMode,
      razorpayAccountId, 
      paytmWalletNumber,
      paytmMerchantId,
      bankDetails,
      contactEmail, 
      contactPhone, 
      active 
    } = req.body;

    if (!collegeName || !payoutMode) {
      return res.status(400).json({ message: 'College name and Payout Mode are required' });
    }

    const account = await CollegeAccount.findOneAndUpdate(
      { collegeName },
      { 
        payoutMode,
        razorpayAccountId, 
        paytmWalletNumber,
        paytmMerchantId,
        bankDetails,
        contactEmail, 
        contactPhone, 
        active 
      },
      { new: true, upsert: true }
    );
    res.json({ message: 'College Account configuration saved successfully', account });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/settlements - Fetch all settlement ledger entries
router.get('/settlements', isAdmin, async (req, res) => {
  try {
    const { status, college } = req.query;
    const filter = {};
    if (status) filter.settlementStatus = status;
    if (college) filter.collegeName = { $regex: college, $options: 'i' };

    const entries = await SettlementLedger.find(filter).sort({ createdAt: -1 });

    // Aggregate summary stats
    const allEntries = await SettlementLedger.find({});
    const totalCollected = allEntries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    const totalPlatformFee = allEntries.reduce((sum, e) => sum + (e.platformFee || 0), 0);
    const totalCollegeShare = allEntries.reduce((sum, e) => sum + (e.collegeShare || 0), 0);
    const pendingCount = allEntries.filter(e => e.settlementStatus === 'pending').length;
    const settledCount = allEntries.filter(e => e.settlementStatus === 'settled').length;
    const pendingAmount = allEntries.filter(e => e.settlementStatus === 'pending').reduce((sum, e) => sum + (e.collegeShare || 0), 0);

    res.json({
      entries,
      summary: {
        totalCollected,
        totalPlatformFee,
        totalCollegeShare,
        pendingCount,
        settledCount,
        pendingAmount
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/settlements/:id/settle - Mark a ledger entry as settled
router.post('/settlements/:id/settle', isAdmin, async (req, res) => {
  try {
    const { referenceId } = req.body;
    const entry = await SettlementLedger.findByIdAndUpdate(
      req.params.id,
      {
        settlementStatus: 'settled',
        referenceId: referenceId || `MANUAL-${Date.now()}`,
        settledAt: new Date()
      },
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: 'Ledger entry not found' });
    res.json({ message: 'Settlement marked as completed', entry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
