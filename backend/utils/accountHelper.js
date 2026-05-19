const mergeUsers = async (targetUser, sourceUser) => {
  if (!targetUser || !sourceUser || targetUser._id.toString() === sourceUser._id.toString()) {
    return targetUser;
  }
  
  console.log(`[Account Merge] Merging source user ${sourceUser._id} into target user ${targetUser._id}`);

  // Copy missing fields
  if (sourceUser.name && (!targetUser.name || targetUser.name === 'Student')) {
    targetUser.name = sourceUser.name;
  }
  if (sourceUser.email && !targetUser.email) {
    targetUser.email = sourceUser.email;
  }
  if (sourceUser.mobile && !targetUser.mobile) {
    targetUser.mobile = sourceUser.mobile;
  }
  if (sourceUser.dob && !targetUser.dob) {
    targetUser.dob = sourceUser.dob;
  }
  if (sourceUser.currentAcademicYear && !targetUser.currentAcademicYear) {
    targetUser.currentAcademicYear = sourceUser.currentAcademicYear;
  }

  // Update Applications in DB
  const { Application } = require('../models');
  const updateRes = await Application.updateMany(
    { student: sourceUser._id },
    { $set: { student: targetUser._id } }
  );
  console.log(`[Account Merge] Updated ${updateRes.modifiedCount} applications to point to target user.`);

  // Save target user
  await targetUser.save();

  // Delete source user
  const { User } = require('../models');
  await User.deleteOne({ _id: sourceUser._id });

  return targetUser;
};

module.exports = { mergeUsers };
