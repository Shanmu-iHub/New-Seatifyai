const mongoose = require('mongoose');
const { Application } = require('./models/index.js');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seatify')
  .then(async () => {
    // Find applications with missing or 'Unknown' collegeName
    const apps = await Application.find({
      $or: [
        { collegeName: { $exists: false } },
        { collegeName: null },
        { collegeName: "" },
        { collegeName: "Unknown" }
      ],
      paymentStatus: 'completed'
    });
    
    console.log(`Found ${apps.length} applications with missing/Unknown collegeName.`);
    
    for (let app of apps) {
      console.log(`Updating application ${app.applicationId || app._id}...`);
      app.collegeName = "Dr. SNS Rajalakshmi College of Arts & Science";
      await app.save();
    }
    
    console.log("Update complete.");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
