const express = require('express');
const router = express.Router();
const { Course } = require('../models');
const auth = require('../middleware/auth');
const axios = require('axios');
const XLSX = require('xlsx');
const { google } = require('googleapis');
const path = require('path');

const SHEET_URL = process.env.GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1wQvxrTXlULUTCssHwySjz8G6b-5kwBSYD6wkMx54aSk/export?format=csv';
const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzV93O99qhhcvSKJ_smlu0q70nlD18IuKhQkZj1bkbSfbMDFQg0cP1_MTKut4PJk4in2w/exec';

// Extract Spreadsheet ID from URL
const extractSheetId = (url) => {
  const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
};

const fetchCoursesFromSheet = async () => {
  try {
    // 1. Try Google Sheets API with Service Account (Highest priority, works for Restricted sheets)
    const sheetId = extractSheetId(SHEET_URL);
    const keyPath = path.join(__dirname, '../google-key.json');

    let auth;
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

        auth = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      } catch (err) {
        console.warn('⚠️ Parse GOOGLE_PRIVATE_KEY failed:', err.message);
      }
    }

    if (!auth && process.env.GOOGLE_CREDS) {
      try {
        const creds = JSON.parse(process.env.GOOGLE_CREDS);
        if (creds.private_key) {
          creds.private_key = creds.private_key.replace(/\\n/g, '\n');
        }
        auth = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      } catch (parseErr) {
        console.warn('⚠️ Parse GOOGLE_CREDS failed:', parseErr.message);
      }
    }

    if (!auth && require('fs').existsSync(keyPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }

    if (sheetId && auth) {
      try {
        console.log('📡 Fetching courses via Google Sheets API (Service Account)...');
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Course details!A:Z', // Assumes tab name is "Course details"
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
          return processSheetRows(data);
        }
      } catch (apiErr) {
        console.warn('⚠️ Google Sheets API failed:', apiErr.message);
      }
    }

    // 2. Try fetching via Script URL
    if (SCRIPT_URL) {
      try {
        console.log('📡 Attempting to fetch courses via Google Apps Script...');
        const scriptResponse = await axios.get(SCRIPT_URL, { timeout: 10000 });
        if (Array.isArray(scriptResponse.data) && scriptResponse.data.length > 0) {
          return processSheetRows(scriptResponse.data);
        }
      } catch (scriptErr) {
        console.warn('⚠️ Apps Script fetch failed:', scriptErr.message);
      }
    }

    // 3. Fallback to direct CSV export (requires public sheet)
    const exportUrl = SHEET_URL.includes('gid=') ? SHEET_URL : `${SHEET_URL}&gid=0`;
    const response = await axios.get(exportUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const data = new TextDecoder('utf-8').decode(response.data);
    const workbook = XLSX.read(data, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const csvRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return processSheetRows(csvRows);

  } catch (err) {
    console.error('❌ All Google Sheets fetch methods failed:', err.message);
    throw err;
  }
};

const processSheetRows = (rows) => {
  if (!rows || rows.length === 0) {
    console.error('❌ Google Sheet data is empty or headers are missing.');
    return [];
  }

  const courseMap = {};
  rows.forEach((row, i) => {
    // Create a normalized row with lowercase keys for case-insensitive matching
    const cleanRow = {};
    Object.keys(row).forEach(k => {
      cleanRow[k.toLowerCase().trim()] = row[k];
    });
    const getRowValue = (...keys) => {
      for (const key of keys) {
        const value = cleanRow[key.toLowerCase().trim()];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return value;
        }
      }

      const qualificationKey = Object.keys(cleanRow).find(key => {
        const compact = key.replace(/[^a-z]/g, '');
        return compact.includes('qualification') && (compact.includes('minimum') || compact.includes('minmum'));
      });
      return qualificationKey ? cleanRow[qualificationKey] : '';
    };

    const status = String(cleanRow['status'] || '').trim().toLowerCase();
    if (status !== 'active') return;

    let cat = String(cleanRow['category'] || '').trim();
    if (!cat || cat.toLowerCase().includes('engineering')) cat = 'Engineering & Tech';
    if (cat.toLowerCase() === 'k12') cat = 'K-12';

    const cName = String(cleanRow['course name'] || 'General').trim();
    const pName = String(cleanRow['program name'] || 'General Program').trim();
    const fee = Number(cleanRow['fee']) || 0;
    const totalSeats = Number(cleanRow['total seats']) || 60;
    const seatsAvail = Number(cleanRow['seats available'] !== undefined ? cleanRow['seats available'] : totalSeats);
    const emoji = String(cleanRow['emoji'] || '📚').trim();
    const college = String(cleanRow['college name'] || 'SNS Institutions').trim();
    const type = String(cleanRow['course type'] || '').trim();
    const minimumQualification = String(getRowValue(
      'minmum qualification',
      'minimum qualification',
      'minimum qualifications',
      'minmum qulaification',
      'minimum qulaification'
    )).trim();

    const key = `${cat}-${cName}`;
    if (!courseMap[key]) {
      courseMap[key] = {
        name: cName,
        collegeName: college,
        type: type,
        category: cat,
        emoji: emoji,
        programs: []
      };
    }
    courseMap[key].programs.push({
      _id: `p${i}`,
      name: pName,
      fee: fee,
      seats: seatsAvail,
      totalSeats: totalSeats,
      minimumQualification: minimumQualification
    });
  });

  const result = Object.values(courseMap).map((c, i) => ({ ...c, _id: `c${i}` }));
  console.log(`✅ Successfully processed ${result.length} LIVE courses from Google Sheets`);
  if (result.length > 0) {
    console.log('📝 Sample Data from Sheet (First 2 items):', JSON.stringify(result.slice(0, 2), null, 2));
  }
  return result;
};

// Seed data
const SEED_COURSES = [
  {
    name: 'AI & Data Science', type: 'B.E./B.Tech', category: 'Engineering & Tech', programs: [
      { name: 'Artificial Intelligence & Data Science', fee: 120000, seats: 45 },
      { name: 'Artificial Intelligence & Machine Learning', fee: 115000, seats: 30 },
      { name: 'Data Science *', fee: 110000, seats: 60 },
    ]
  },
  {
    name: 'Computer Science', type: 'B.E./B.Tech', category: 'Engineering & Tech', programs: [
      { name: 'Computer Science and Engineering', fee: 125000, seats: 50 },
      { name: 'Computer Science and Design', fee: 118000, seats: 40 },
      { name: 'Computer Science and Technology', fee: 116000, seats: 35 },
      { name: 'CSE (IOT & Cyber Security)', fee: 122000, seats: 25 },
      { name: 'Information Technology', fee: 112000, seats: 55 },
    ]
  },
  {
    name: 'Core Engineering', type: 'B.E./B.Tech', category: 'Engineering & Tech', programs: [
      { name: 'Mechanical & Mechatronics', fee: 108000, seats: 60 },
      { name: 'Mechanical Engineering', fee: 105000, seats: 70 },
      { name: 'Civil Engineering', fee: 100000, seats: 80 },
      { name: 'Electrical & Electronics Engg.', fee: 110000, seats: 45 },
      { name: 'Electronics & Communication', fee: 112000, seats: 50 },
    ]
  },
  {
    name: 'Specialized Engineering', type: 'B.E./B.Tech', category: 'Engineering & Tech', programs: [
      { name: 'Aerospace Engineering', fee: 130000, seats: 20 },
      { name: 'Mechatronics Engineering', fee: 115000, seats: 30 },
      { name: 'Bio-Medical Engineering', fee: 118000, seats: 25 },
      { name: 'Food Technology', fee: 98000, seats: 40 },
    ]
  },
  {
    name: 'PG Programs', type: 'MBA/MCA', category: 'Engineering & Tech', programs: [
      { name: 'MBA', fee: 80000, seats: 60 },
      { name: 'MCA', fee: 75000, seats: 50 },
      { name: 'MBA in Business Analytics', fee: 90000, seats: 30 },
      { name: 'Ph.D - CIVIL, CSE, ECE, EEE, Mech.', fee: 60000, seats: 15 },
    ]
  },
  {
    name: 'Science Stream', type: 'Class 11-12', category: 'K-12', programs: [
      { name: 'Physics, Chemistry, Maths (PCM)', fee: 45000, seats: 80 },
      { name: 'Physics, Chemistry, Biology (PCB)', fee: 45000, seats: 80 },
    ]
  },
  {
    name: 'B.Sc Programs', type: 'Bachelor of Science', category: 'Arts & Science', programs: [
      { name: 'B.Sc Computer Science', fee: 65000, seats: 60 },
      { name: 'B.Sc Mathematics', fee: 55000, seats: 70 },
    ]
  },
  {
    name: 'Nursing', type: 'B.Sc Nursing', category: 'Paramedical', programs: [
      { name: 'B.Sc Nursing (4 years)', fee: 95000, seats: 40 },
      { name: 'GNM Nursing (3 years)', fee: 70000, seats: 50 },
    ]
  },
  {
    name: 'B.Ed Programs', type: 'Bachelor of Education', category: 'Education', programs: [
      { name: 'B.Ed (2 years)', fee: 50000, seats: 100 },
    ]
  },
];

// --- Caching Layer for Google Sheets Data ---
let cachedCourses = null;
let lastFetchTime = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
let isFetching = false;

const updateCache = async () => {
  if (isFetching) return;
  isFetching = true;
  try {
    console.log('📡 Background fetching courses from Google Sheets...');
    const sheetCourses = await fetchCoursesFromSheet();
    if (sheetCourses && sheetCourses.length > 0) {
      cachedCourses = sheetCourses;
      lastFetchTime = Date.now();
      console.log(`✅ Cached ${cachedCourses.length} courses from Google Sheets.`);
    }
  } catch (err) {
    console.error('❌ Failed to update courses cache from Google Sheets:', err.message);
  } finally {
    isFetching = false;
  }
};

// Start background fetch immediately on load
setTimeout(updateCache, 1000);

// Periodically refresh the cache in background every 5 minutes
setInterval(updateCache, CACHE_TTL);

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    // If force refresh is requested, bypass cache and fetch live
    if (forceRefresh) {
      console.log('🔄 Forced refresh requested. Fetching live courses from Google Sheets...');
      try {
        const sheetCourses = await fetchCoursesFromSheet();
        if (sheetCourses && sheetCourses.length > 0) {
          cachedCourses = sheetCourses;
          lastFetchTime = Date.now();
          return res.json(sheetCourses);
        }
      } catch (sheetErr) {
        console.warn('Google Sheets fetch failed during forced refresh:', sheetErr.message);
      }
    }

    // 1. Serve immediately from cache if available (Instant load)
    if (cachedCourses && cachedCourses.length > 0) {
      // If cache is expired, trigger background update (doesn't block response)
      if (!lastFetchTime || (Date.now() - lastFetchTime > CACHE_TTL)) {
        console.log('🔄 Cache expired. Triggering background cache update...');
        updateCache().catch(err => console.error('Error updating cache in background:', err.message));
      }
      return res.json(cachedCourses);
    }

    // 2. Cache is empty (e.g., first request right after server starts). Fetch synchronously once.
    console.log('⏳ Cache empty. Fetching live courses synchronously...');
    try {
      const sheetCourses = await fetchCoursesFromSheet();
      if (sheetCourses && sheetCourses.length > 0) {
        cachedCourses = sheetCourses;
        lastFetchTime = Date.now();
        return res.json(sheetCourses);
      }
    } catch (sheetErr) {
      console.warn('Google Sheets fetch failed, falling back to DB/Seed:', sheetErr.message);
    }

    // 3. Database / Seed fallback if Google Sheets fetch fails completely
    let courses = await Course.find({ active: true });
    if (courses.length === 0) {
      try {
        courses = await Course.insertMany(SEED_COURSES);
      } catch {
        return res.json(SEED_COURSES.map((c, i) => ({ ...c, _id: String(i + 1) })));
      }
    }
    res.json(courses);
  } catch (err) {
    res.json(SEED_COURSES.map((c, i) => ({ ...c, _id: String(i + 1) })));
  }
});

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/courses/:id/decrement-seat
router.patch('/:courseId/programs/:programId/decrement', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const program = course.programs.id(req.params.programId);
    if (!program) return res.status(404).json({ message: 'Program not found' });
    if ((program.seatsAvailable || program.seats) <= 0)
      return res.status(400).json({ message: 'No seats available' });
    program.seatsAvailable = (program.seatsAvailable || program.seats) - 1;
    program.seats = program.seatsAvailable;
    await course.save();
    res.json({ message: 'Seat decremented', seatsAvailable: program.seatsAvailable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
