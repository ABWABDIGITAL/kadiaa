const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel'); // Adjust the path to your User model

dotenv.config(); // Load environment variables from .env file

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const adminUser = new User({
      username: 'admin', 
      email: 'admin@example.com',
      password: 'adminpassword',
      isAdmin: true,
    });

    await adminUser.save();
    console.log('Admin user created');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

createAdminUser();
