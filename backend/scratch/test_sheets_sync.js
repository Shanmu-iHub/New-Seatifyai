const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

async function testSync() {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzV93O99qhhcvSKJ_smlu0q70nlD18IuKhQkZj1bkbSfbMDFQg0cP1_MTKut4PJk4in2w/exec';
  
  console.log('🚀 Starting Google Sheets Sync Test...');
  console.log('Sending to URL:', scriptUrl);

  const testData = {
    applicationId: `TEST-SYNC-${Date.now()}`,
    studentName: 'Test Student (College Name Fix)',
    email: 'test@example.com',
    mobile: '9876543210',
    course: 'Artificial Intelligence & Data Science',
    program: 'B.E/B.Tech',
    college: 'SNS College of Technology', // Sending both keys as per backend logic
    collegeName: 'SNS College of Technology',
    fee: 2,
    paymentId: 'pay_TEST_RAZORPAY_123',
    folderUrl: 'https://drive.google.com/test-folder',
    date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };

  try {
    const response = await axios.post(scriptUrl, testData);
    console.log('✅ Google Sheets Response:', response.data);
    console.log('\nSUCCESS: Please check your spreadsheet for a row with "SNS College of Technology"');
  } catch (err) {
    console.error('❌ Sync Failed:', err.message);
    if (err.response) {
      console.error('Response Data:', err.response.data);
    }
  }
}

testSync();
