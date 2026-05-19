const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Application } = require('../models');

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
        paymentId: a.paymentId,
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

    let user = req.user;
    
    // Check if another user already exists with this email or mobile
    const { User } = require('../models');
    const otherUser = await User.findOne({
      _id: { $ne: user._id },
      $or: [
        { email: email.trim().toLowerCase() },
        { mobile: mobile.trim() }
      ]
    });

    if (otherUser) {
      user.name = name;
      user.email = email.trim().toLowerCase();
      user.mobile = mobile.trim();
      user.dob = dob;
      const { mergeUsers } = require('../utils/accountHelper');
      user = await mergeUsers(user, otherUser);
    } else {
      user.name = name;
      user.email = email.trim().toLowerCase();
      user.mobile = mobile.trim();
      user.dob = dob;
      await user.save();
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
