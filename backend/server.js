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
