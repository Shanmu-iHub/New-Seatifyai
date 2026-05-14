const express = require('express');
const router = express.Router();
const { Course } = require('../models');
const auth = require('../middleware/auth');
const axios = require('axios');
const XLSX = require('xlsx');

const SHEET_URL = process.env.GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1wQvxrTXlULUTCssHwySjz8G6b-5kwBSYD6wkMx54aSk/export?format=csv';
const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbylzIZGJ76BacMewUntlAkAxgnIsNV6LH5QyT695o9Yg2OtuUbsixEdg72ZPiXUFD3a4A/exec';

const fetchCoursesFromSheet = async () => {
  try {
    const response = await axios.get(SHEET_URL, { 
      responseType: 'arraybuffer',
      timeout: 10000 
    });
    const data = new TextDecoder('utf-8').decode(response.data);
    const workbook = XLSX.read(data, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows || rows.length === 0) {
      console.warn('⚠️ Google Sheet is empty or headers are missing.');
      return [];
    }

    const courseMap = {};
    rows.forEach((row, i) => {
      const status = String(row['Status'] || '').trim().toLowerCase();
      if (status !== 'active') return;

      let cat = String(row['Category'] || 'Engineering & Tech').trim();
      if (cat.toLowerCase() === 'k12') cat = 'K-12';
      else if (cat.toLowerCase().includes('engineering')) cat = 'Engineering & Tech';
      else if (cat.toLowerCase().includes('arts')) cat = 'Arts & Science';

      const cName = String(row['Course Name'] || 'General').trim();
      const pName = String(row['Program Name'] || 'General Program').trim();
      const fee = Number(row['Fee']) || 0;
      const seats = Number(row['Total Seats']) || 60;
      const seatsAvailable = Number(row['Seats Available'] !== undefined ? row['Seats Available'] : seats);
      const emoji = String(row['Emoji'] || '📚').trim();

      const key = `${cat}-${cName}`;
      if (!courseMap[key]) {
        courseMap[key] = {
          name: cName,
          type: String(row['Course Type'] || '').trim(),
          category: cat,
          emoji: emoji,
          programs: []
        };
      }
      courseMap[key].programs.push({
        _id: `p${i}`,
        name: pName,
        fee: fee,
        seats: seats,
        seatsAvailable: seatsAvailable
      });
    });

    const result = Object.values(courseMap).map((c, i) => ({ ...c, _id: `c${i}` }));
    console.log(`✅ Successfully fetched ${result.length} courses from Google Sheets`);
    return result;
  } catch (err) {
    console.error('❌ Google Sheets fetch error:', err.message);
    throw err;
  }
};

// Seed data
const SEED_COURSES = [
  { name: 'AI & Data Science', type: 'B.E./B.Tech', category: 'Engineering & Tech', programs: [
    { name: 'Artificial Intelligence & Data Science', fee: 120000, seats: 45 },
    { name: 'Artificial Intelligence & Machine Learning', fee: 115000, seats: 30 },
    { name: 'Data Science *', fee: 110000, seats: 60 },
  ]},
  { name: 'Computer Science', type: 'B.E./B.Tech', category: 'Engineering & Tech', programs: [
    { name: 'Computer Science and Engineering', fee: 125000, seats: 50 },
    { name: 'Computer Science and Design', fee: 118000, seats: 40 },
    { name: 'Computer Science and Technology', fee: 116000, seats: 35 },
    { name: 'CSE (IOT & Cyber Security)', fee: 122000, seats: 25 },
    { name: 'Information Technology', fee: 112000, seats: 55 },
  ]},
  { name: 'Core Engineering', type: 'B.E./B.Tech', category: 'Engineering & Tech', programs: [
    { name: 'Mechanical & Mechatronics', fee: 108000, seats: 60 },
    { name: 'Mechanical Engineering', fee: 105000, seats: 70 },
    { name: 'Civil Engineering', fee: 100000, seats: 80 },
    { name: 'Electrical & Electronics Engg.', fee: 110000, seats: 45 },
    { name: 'Electronics & Communication', fee: 112000, seats: 50 },
  ]},
  { name: 'Specialized Engineering', type: 'B.E./B.Tech', category: 'Engineering & Tech', programs: [
    { name: 'Aerospace Engineering', fee: 130000, seats: 20 },
    { name: 'Mechatronics Engineering', fee: 115000, seats: 30 },
    { name: 'Bio-Medical Engineering', fee: 118000, seats: 25 },
    { name: 'Food Technology', fee: 98000, seats: 40 },
  ]},
  { name: 'PG Programs', type: 'MBA/MCA', category: 'Engineering & Tech', programs: [
    { name: 'MBA', fee: 80000, seats: 60 },
    { name: 'MCA', fee: 75000, seats: 50 },
    { name: 'MBA in Business Analytics', fee: 90000, seats: 30 },
    { name: 'Ph.D - CIVIL, CSE, ECE, EEE, Mech.', fee: 60000, seats: 15 },
  ]},
  { name: 'Science Stream', type: 'Class 11-12', category: 'K-12', programs: [
    { name: 'Physics, Chemistry, Maths (PCM)', fee: 45000, seats: 80 },
    { name: 'Physics, Chemistry, Biology (PCB)', fee: 45000, seats: 80 },
  ]},
  { name: 'B.Sc Programs', type: 'Bachelor of Science', category: 'Arts & Science', programs: [
    { name: 'B.Sc Computer Science', fee: 65000, seats: 60 },
    { name: 'B.Sc Mathematics', fee: 55000, seats: 70 },
  ]},
  { name: 'Nursing', type: 'B.Sc Nursing', category: 'Paramedical', programs: [
    { name: 'B.Sc Nursing (4 years)', fee: 95000, seats: 40 },
    { name: 'GNM Nursing (3 years)', fee: 70000, seats: 50 },
  ]},
  { name: 'B.Ed Programs', type: 'Bachelor of Education', category: 'Education', programs: [
    { name: 'B.Ed (2 years)', fee: 50000, seats: 100 },
  ]},
];

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    // Try fetching from Google Sheets first
    try {
      const sheetCourses = await fetchCoursesFromSheet();
      if (sheetCourses.length > 0) return res.json(sheetCourses);
    } catch (sheetErr) {
      console.warn('Google Sheets fetch failed, falling back to DB/Seed:', sheetErr.message);
    }

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
