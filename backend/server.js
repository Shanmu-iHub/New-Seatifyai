const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Middleware
app.use(cors({
  origin: [
    /https?:\/\/.*\.?seatifyai\.com$/,
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true
}));

// Basic Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: false // Allow cross-origin image loading if needed
}));

// Prevent NoSQL Injection
app.use(mongoSanitize());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate Limiting (Prevent DDoS / Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use(limiter);

// Stricter Rate Limiting for Auth/OTP routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit each IP to 30 requests per 15 minutes for auth endpoints
  message: { message: "Too many login attempts from this IP, please try again after 15 minutes." }
});
app.use('/api/auth', authLimiter);

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
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
// Connect DB — runs immediately (works in both serverless and traditional server)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seatifyai')
  .then(async () => {
    console.log('✅ MongoDB connected');
    try {
      const { User } = require('./models');
      
      // Check if user with mobile '9600940618' exists
      const existingUser = await User.findOne({ mobile: '9600940618' });
      if (existingUser) {
        if (existingUser.role !== 'admin') {
          existingUser.role = 'admin';
          await existingUser.save();
          console.log('🔑 Existing user with mobile 9600940618 promoted to Admin!');
        }
      } else {
        // Double check if any default admin exists
        const defaultAdmin = await User.findOne({ email: 'admin@seatifyai.com' });
        if (!defaultAdmin) {
          await User.create({
            name: 'Support Admin',
            mobile: '9600940618',
            email: 'admin@seatifyai.com',
            dob: '1990-01-01',
            role: 'admin'
          });
          console.log('🔑 Default Admin account seeded: admin@seatifyai.com / 9600940618');
        } else {
          defaultAdmin.mobile = '9600940618';
          await defaultAdmin.save();
          console.log('🔑 Default Admin mobile updated to 9600940618');
        }
      }
    } catch (seedErr) {
      console.warn('⚠️ Seeding admin failed:', seedErr.message);
    }
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));

// Only bind a port when NOT running on Vercel (local dev or VPS)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => console.log(`🚀 Seatifyai server running on port ${PORT}`));

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} in use. Attempting to kill occupant...`);
      const { execSync } = require('child_process');
      const platform = process.platform;
      try {
        if (platform === 'win32') {
          const output = execSync(`netstat -ano | findstr :${PORT}`).toString();
          const lines = output.trim().split('\n');
          const pids = new Set();
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
              const pid = parts[parts.length - 1];
              if (pid && pid !== '0' && !isNaN(pid)) {
                pids.add(pid.trim());
              }
            }
          }
          for (const pid of pids) {
            console.log(`Killing process ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`);
          }
        } else {
          execSync(`lsof -ti :${PORT} | xargs kill -9`);
        }
        console.log(`✅ Killed process on port ${PORT}. Retrying in 1 second...`);
        setTimeout(() => {
          server.listen(PORT);
        }, 1000);
      } catch (killErr) {
        console.error('❌ Could not kill process:', killErr.message);
        process.exit(1);
      }
    } else {
      throw err;
    }
  });
}

// Initialize document reminder cron job
require('./cron/documentReminder');

module.exports = app;
