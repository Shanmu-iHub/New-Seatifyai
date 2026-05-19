require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seatifyai').then(async () => {
  const { User } = require('./models');
  const users = await User.find({ mobile: '9600940618' });
  console.log("=== USERS WITH 9600940618 ===");
  console.log(users);
  process.exit(0);
}).catch(console.error);
