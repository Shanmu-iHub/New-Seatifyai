const mongoose = require('mongoose');
const { Course } = require('./models/index.js');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seatify')
  .then(async () => {
    const courses = await Course.find({}).limit(2);
    console.log(JSON.stringify(courses, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
