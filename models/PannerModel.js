const mongoose = require('mongoose');

const specialLawyerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: [6, "Title must be at least 6 characters long"],
    maxlength: [150, "Title cannot exceed 150 characters"],
  },
  link: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true, // If you need description to be required; otherwise, set it to false
  },
}, {
  toJSON: { 
    transform: (doc, ret) => {
      delete ret.__v; // Remove __v from JSON responses
    }
  },
  toObject: { 
    transform: (doc, ret) => {
      delete ret.__v; // Remove __v from Object responses
    }
  }
});

const SpecialLawyer = mongoose.model('SpecialLawyer', specialLawyerSchema);

module.exports = SpecialLawyer;
