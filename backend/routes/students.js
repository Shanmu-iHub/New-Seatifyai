const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Application } = require('../models');

const maskReference = (value, visibleCount = 5) => {
  if (!value || typeof value !== 'string') return value;

  const separatorIndex = value.indexOf('_');
  if (separatorIndex === -1) return value;

  const prefix = value.slice(0, separatorIndex + 1);
  const suffix = value.slice(-visibleCount);
  const hiddenLength = Math.max(0, value.length - prefix.length - suffix.length);

  return `${prefix}${'*'.repeat(hiddenLength)}${suffix}`;
};

// GET /api/students/check-email
router.get('/check-email', auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const { User } = require('../models');
    
    // Find a user with this email that is NOT the current logged-in user
    const existingUser = await User.findOne({
      email: cleanEmail,
      _id: { $ne: req.user._id }
    });
    
    res.json({ exists: !!existingUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/check-mobile
router.get('/check-mobile', auth, async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }
    const cleanMobile = mobile.replace(/\D/g, '').slice(0, 10);
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits' });
    }
    const { User } = require('../models');
    
    // Find a user with this mobile that is NOT the current logged-in user
    const existingUser = await User.findOne({
      mobile: cleanMobile,
      _id: { $ne: req.user._id }
    });
    
    res.json({ exists: !!existingUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const latest = await Application.findOne({ student: req.user._id }).sort({ createdAt: -1 });
    const admissions = await Application.find({ student: req.user._id, paymentStatus: 'completed' }).sort({ createdAt: -1 });

    res.json({
      profile: latest ? {
        fullName: latest.fullName,
        email: latest.email,
        mobile: latest.mobile,
        dob: latest.dob,
        admissionType: latest.admissionType,
        gender: latest.gender,
        fatherName: latest.fatherName,
        motherName: latest.motherName,
        parentName: latest.parentName,
        parentOccupation: latest.parentOccupation,
        parentMobile: latest.parentMobile,
        homeTown: latest.homeTown,
        district: latest.district,
        districtOther: latest.districtOther,
        currentQualification: latest.currentQualification,
        street: latest.street,
        city: latest.city,
        state: latest.state,
        pin: latest.pin,
        nationality: latest.nationality,
        religion: latest.religion,
        community: latest.community,
        aadhar: latest.aadhar,
        prevSchool: latest.prevSchool,
        qualification: latest.qualification,
        board: latest.board,
        yearOfPassing: latest.yearOfPassing,
        percentage: latest.percentage,
        docs: latest.docs,
        category: latest.category,
      } : {
        fullName: req.user.name,
        email: req.user.email,
        mobile: req.user.mobile,
        dob: req.user.dob,
      },
      admissions: admissions.map(a => ({
        _id: a._id,
        applicationId: a.applicationId,
        courseName: a.courseName,
        programName: a.programName,
        collegeName: a.collegeName || 'SNS Institutions',
        category: a.category,
        docs: a.docs,
        fee: a.fee,
        paymentId: maskReference(a.paymentId, 5),
        status: a.status,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/students/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, mobile, dob } = req.body;
    
    // Validate required fields
    if (!name || !email || !mobile || !dob) {
      return res.status(400).json({ message: 'All fields (Full Name, Email, Mobile, Date of Birth) are required' });
    }

    // Validate mobile: exactly 10 digits
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits' });
    }

    let user = req.user;
    
    // Check if another user already exists with this email or mobile
    const { User } = require('../models');
    const otherUser = await User.findOne({
      _id: { $ne: user._id },
      $or: [
        { email: email.trim().toLowerCase() },
        { mobile: cleanMobile }
      ]
    });

    if (otherUser) {
      user.name = name;
      user.email = email.trim().toLowerCase();
      user.mobile = cleanMobile;
      user.dob = dob;
      const { mergeUsers } = require('../utils/accountHelper');
      user = await mergeUsers(user, otherUser);
    } else {
      user.name = name;
      user.email = email.trim().toLowerCase();
      user.mobile = cleanMobile;
      user.dob = dob;
      await user.save();
    }

    // Update the latest application's personal details if one exists
    const latest = await Application.findOne({ student: user._id }).sort({ createdAt: -1 });
    if (latest) {
      latest.fullName = req.body.fullName || name || latest.fullName;
      latest.email = email || latest.email;
      latest.mobile = mobile || latest.mobile;
      latest.dob = dob || latest.dob;
      if (req.body.community !== undefined) latest.community = req.body.community;
      if (req.body.parentName !== undefined) latest.parentName = req.body.parentName;
      if (req.body.parentOccupation !== undefined) latest.parentOccupation = req.body.parentOccupation;
      if (req.body.parentMobile !== undefined) latest.parentMobile = req.body.parentMobile;
      if (req.body.homeTown !== undefined) latest.homeTown = req.body.homeTown;
      if (req.body.district !== undefined) latest.district = req.body.district;
      if (req.body.districtOther !== undefined) latest.districtOther = req.body.districtOther;
      if (req.body.currentQualification !== undefined) latest.currentQualification = req.body.currentQualification;
      if (req.body.aadhar !== undefined) latest.aadhar = req.body.aadhar;
      await latest.save();
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        dob: user.dob
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
