# Seatifyai — MERN Stack Smart Admission Portal

A fully-featured, mobile-first online admission portal built with React, Node.js, Express, and MongoDB.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and Install

```bash
# Install all dependencies
npm run install:all

# Or manually:
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

Required variables in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/seatifyai
JWT_SECRET=your_strong_secret_here
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
MAIL_USER=your@gmail.com
MAIL_PASS=your_app_password
```

### 3. Run Development

```bash
# From root — runs both frontend (3000) and backend (5000)
npm run dev

# Or separately:
npm run start:backend   # Backend on :5000
npm run start:frontend  # Frontend on :3000
```

---

## 📁 Project Structure

```
seatifyai/
├── frontend/                 # React + Tailwind CSS
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.jsx       # OTP login (email/mobile)
│       │   ├── CoursesPage.jsx     # Course listing with filters
│       │   ├── ApplicationForm.jsx # 3-step multi-form
│       │   ├── PaymentPage.jsx     # Razorpay integration
│       │   ├── ConfirmationPage.jsx # Success animation
│       │   └── ProfilePage.jsx     # Student dashboard
│       ├── components/
│       │   └── Navbar.jsx
│       └── context/
│           └── AuthContext.jsx     # JWT auth state
│
└── backend/                  # Node.js + Express
    ├── server.js
    ├── models/index.js         # MongoDB schemas
    ├── middleware/auth.js      # JWT verification
    └── routes/
        ├── auth.js             # OTP send/verify
        ├── courses.js          # Course CRUD + seat management
        ├── applications.js     # Form submission + file upload
        ├── payment.js          # Razorpay create-order + verify
        └── students.js         # Student profile
```

---

## 🔑 Key Features

### Authentication
- Email OTP via Nodemailer (Gmail/SendGrid)
- SMS OTP via Twilio (MSG91 compatible)
- JWT sessions (7-day expiry)
- **Dev mode**: OTP `123456` works without email/SMS setup

### Courses
- Dynamic course listing from MongoDB
- Auto-seeded on first launch
- Filter tabs: K-12, Engineering & Tech, Arts & Science, Paramedical, Education
- Live seat tracking

### Application Flow
1. **Personal Details** — name, DOB, address, Aadhar, community
2. **Academic Details** — school, qualifications, marks
3. **Document Upload** — photo, Aadhar, mark sheets, TC, community cert
4. **Payment** — Razorpay (UPI, cards, net banking, wallets)
5. **Confirmation** — animated success + email receipt

### Business Rules
- ✅ One admission per student per academic year
- ✅ Seat count decrements on payment confirmation
- ✅ Profile is read-only after payment
- ✅ Server-side Razorpay signature verification
- ✅ Confirmation email auto-sent with PDF receipt

---

## 🎨 Design

- **Theme**: Dark mode (#0F0F13 background)
- **Primary**: Indigo #4F46E5
- **Fonts**: Clash Display (headings) + Satoshi (body)
- **Cards**: Dark rounded cards with subtle borders
- **Mobile-first**: Tailwind breakpoints, sticky CTAs

---

## 🔧 Configuration Reference

### Razorpay Setup
1. Create account at razorpay.com
2. Get Test API keys from Dashboard > Settings > API Keys
3. Add to `.env`: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### Gmail SMTP Setup
1. Enable 2FA on your Google account
2. Go to Google Account > Security > App Passwords
3. Generate an app password for "Mail"
4. Use this as `MAIL_PASS` in `.env`

### Twilio SMS Setup
1. Create account at twilio.com
2. Get SID, Auth Token, and phone number
3. Add to `.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`

### MongoDB Atlas (Cloud)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seatifyai
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + OTP (Email & SMS) |
| Payment | Razorpay |
| File Upload | Multer (local) / Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| SMS | Twilio |

---

## 🚀 Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Serve with Express (add to server.js):
app.use(express.static('frontend/build'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'frontend/build/index.html')));
```

Deploy to: Render, Railway, DigitalOcean, or Heroku.

---

## 📄 License

MIT License — Built for Seatifyai
# New-Seatifyai
