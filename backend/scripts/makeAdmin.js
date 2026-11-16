// Promote an existing user to admin:  node backend/scripts/makeAdmin.js user@example.com
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node backend/scripts/makeAdmin.js <email>');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!user) {
      console.error(`No user found with email ${email}. Register that user first.`);
      process.exitCode = 1;
    } else {
      console.log(`${user.email} is now an admin.`);
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
