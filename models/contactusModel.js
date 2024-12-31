const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      required: false,
      match: [/^\d{10,15}$/, "Invalid phone number format"], // Accepts 10-15 digits
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
  },
  //{ timestamps: true }
);

module.exports = mongoose.model('ContactUs', contactUsSchema);
