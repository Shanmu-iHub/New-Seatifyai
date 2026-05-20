const mongoose = require('mongoose');
const { Application } = require('./backend/models/index.js');
require('dotenv').config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seatify')
  .then(async () => {
    const apps = await Application.find({ collegeName: /Arts and Science/i, paymentStatus: 'completed' }).select('applicationId studentName fullName collegeName programName createdAt fee');
    console.log(JSON.stringify(apps, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
