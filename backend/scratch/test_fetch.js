const { Course } = require('../models');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const router = express.Router();
const axios = require('axios');
const XLSX = require('xlsx');
const { google } = require('googleapis');

const SHEET_URL = process.env.GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1wQvxrTXlULUTCssHwySjz8G6b-5kwBSYD6wkMx54aSk/export?format=csv';
const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzV93O99qhhcvSKJ_smlu0q70nlD18IuKhQkZj1bkbSfbMDFQg0cP1_MTKut4PJk4in2w/exec';

const extractSheetId = (url) => {
  const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
};

const processSheetRows = (rows) => {
  if (!rows || rows.length === 0) {
    console.error('❌ Google Sheet data is empty or headers are missing.');
    return [];
  }
  const courseMap = {};
  rows.forEach((row, i) => {
    const cleanRow = {};
    Object.keys(row).forEach(k => {
      cleanRow[k.toLowerCase().trim()] = row[k];
    });

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
      totalSeats: totalSeats
    });
  });

  const result = Object.values(courseMap).map((c, i) => ({ ...c, _id: `c${i}` }));
  return result;
};

const fetchCoursesFromSheet = async () => {
  const startTime = Date.now();
  try {
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
          universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || "googleapis.com"
        };

        auth = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        console.log('🔑 Initialized auth using GOOGLE_PRIVATE_KEY env var.');
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
        console.log('🔑 Initialized auth using GOOGLE_CREDS env var.');
      } catch (parseErr) {
        console.warn('⚠️ Parse GOOGLE_CREDS failed:', parseErr.message);
      }
    }

    if (!auth && require('fs').existsSync(keyPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      console.log('🔑 Initialized auth using key file google-key.json.');
    }

    if (sheetId && auth) {
      try {
        console.log('📡 Fetching courses via Google Sheets API (Service Account)...');
        const sheets = google.sheets({ version: 'v4', auth });
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Course details!A:Z',
        });
        console.log(`✅ Method 1 (API) succeeded in ${Date.now() - startTime}ms`);
        return processSheetRows(res.data.values);
      } catch (apiErr) {
        console.warn('⚠️ Method 1 (Google Sheets API) failed:', apiErr.message);
      }
    }

    if (SCRIPT_URL) {
      try {
        console.log('📡 Attempting to fetch courses via Google Apps Script...');
        const scriptResponse = await axios.get(SCRIPT_URL, { timeout: 10000 });
        if (Array.isArray(scriptResponse.data) && scriptResponse.data.length > 0) {
          console.log(`✅ Method 2 (Apps Script) succeeded in ${Date.now() - startTime}ms`);
          return processSheetRows(scriptResponse.data);
        }
      } catch (scriptErr) {
        console.warn('⚠️ Method 2 (Apps Script) failed:', scriptErr.message);
      }
    }

    console.log('📡 Fallback: Fetching public CSV sheet...');
    const exportUrl = SHEET_URL.includes('gid=') ? SHEET_URL : `${SHEET_URL}&gid=0`;
    const response = await axios.get(exportUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const decoded = new TextDecoder('utf-8').decode(response.data);
    const workbook = XLSX.read(decoded, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const csvRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`✅ Method 3 (CSV export) succeeded in ${Date.now() - startTime}ms`);
    return processSheetRows(csvRows);

  } catch (err) {
    console.error(`❌ All Google Sheets fetch methods failed in ${Date.now() - startTime}ms:`, err.message);
    throw err;
  }
};

fetchCoursesFromSheet().then(res => {
  console.log(`🚀 Success! Retrieved ${res.length} courses.`);
  process.exit(0);
}).catch(err => {
  console.error('🚀 Script completed with error');
  process.exit(1);
});
