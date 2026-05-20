const mongoose = require('mongoose');
const { Application } = require('./models/index.js');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seatify')
  .then(async () => {
    const apps = await Application.find({ paymentStatus: 'completed' }).select('courseName programName collegeName');
    console.log(JSON.stringify(apps, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
