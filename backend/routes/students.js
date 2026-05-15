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
      },
      admissions: admissions.map(a => ({
        _id: a._id,
        applicationId: a.applicationId,
        courseName: a.courseName,
        programName: a.programName,
        collegeName: a.collegeName || 'SNS Institutions',
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

module.exports = router;
