const mongoose = require('mongoose');

// OTP Model
const otpSchema = new mongoose.Schema({
  contact: { type: String, required: true },
  type: { type: String, enum: ['email', 'mobile'], required: true },
  otp: { type: String }, // Optional for 2Factor
  sessionId: { type: String }, // For 2Factor.in
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
  dob: String,
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
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
  collegeName: { type: String },
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
  fullName: String, dob: String, gender: String,
  fatherName: String, motherName: String,
  parentName: String, parentOccupation: String, parentMobile: String,
  homeTown: String, district: String, districtOther: String, currentQualification: String,
  email: String, mobile: String,
  physicalApplicationNo: String,
  street: String, city: String, state: String, pin: String,
  nationality: String, religion: String, community: String, aadhar: String,
  // Academic
  prevSchool: String, qualification: String, board: String,
  yearOfPassing: String, percentage: String,
  // Course
  courseId: String, courseName: String, admissionType: String, collegeName: String, category: String, programId: String, programName: String,
  fee: Number,
  // Docs
  docs: {
    photo: String, aadhar: String, previousSchoolTC: String, marksheet10: String,
    marksheet12: String, diplomaCertificate: String, tc: String, community: String, birthCertificate: String,
    admissionForm: String,
  },
  folderUrl: String,
  gradeLevel: String,
  // Payment
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentId: String,
  razorpayOrderId: String,
  status: { type: String, enum: ['submitted', 'confirmed', 'rejected', 'pending', 'cancelled'], default: 'pending' },
  isEdited: { type: Boolean, default: false },
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

// Ticket Model
const ticketReplySchema = new mongoose.Schema({
  sender: { type: String, enum: ['student', 'support'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['Admission', 'Payment', 'Document Verification', 'General Inquiry'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  replies: [ticketReplySchema],
}, { timestamps: true });

ticketSchema.pre('save', function(next) {
  if (!this.ticketId) {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `TIC-${year}-${rand}`;
  }
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = { OTP, User, Course, Application, Ticket };
