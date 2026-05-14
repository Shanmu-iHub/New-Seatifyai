const mongoose = require('mongoose');

// OTP Model
const otpSchema = new mongoose.Schema({
  contact: { type: String, required: true },
  type: { type: String, enum: ['email', 'mobile'], required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
}, { timestamps: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const OTP = mongoose.model('OTP', otpSchema);

// User/Student Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, sparse: true, index: true },
  mobile: { type: String, sparse: true, index: true },
  isActive: { type: Boolean, default: true },
  currentAcademicYear: String,
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// Course Model
const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fee: { type: Number, required: true },
  seats: { type: Number, default: 60 },
  seatsAvailable: { type: Number },
});
programSchema.pre('save', function(next) {
  if (this.seatsAvailable === undefined) this.seatsAvailable = this.seats;
  next();
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  category: { type: String, enum: ['K-12', 'Engineering & Tech', 'Arts & Science', 'Paramedical', 'Education'], required: true },
  programs: [programSchema],
  active: { type: Boolean, default: true },
}, { timestamps: true });
const Course = mongoose.model('Course', courseSchema);

// Application Model
const applicationSchema = new mongoose.Schema({
  applicationId: { type: String, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  academicYear: String,
  // Personal
  fullName: String, dob: String, admissionType: String,
  fatherName: String, motherName: String,
  email: String, mobile: String,
  street: String, city: String, state: String, pin: String,
  nationality: String, religion: String, community: String, aadhar: String,
  // Academic
  prevSchool: String, qualification: String, board: String,
  yearOfPassing: String, percentage: String,
  // Course
  courseId: String, courseName: String, programId: String, programName: String,
  fee: Number,
  // Docs
  docs: {
    photo: String, aadhar: String, marksheet10: String,
    marksheet12: String, tc: String, community: String,
  },
  // Payment
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentId: String,
  razorpayOrderId: String,
  status: { type: String, enum: ['submitted', 'confirmed', 'rejected', 'pending'], default: 'pending' },
}, { timestamps: true });

applicationSchema.pre('save', function(next) {
  if (!this.applicationId) {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.applicationId = `SEATIFY-${year}-${rand}`;
  }
  if (!this.academicYear) {
    const y = new Date().getFullYear();
    this.academicYear = `${y}-${y + 1}`;
  }
  next();
});
const Application = mongoose.model('Application', applicationSchema);

module.exports = { OTP, User, Course, Application };
