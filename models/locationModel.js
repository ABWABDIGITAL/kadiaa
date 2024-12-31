const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Ensures no duplicate location names
  },
  // Replaced administrative levels with area and city
  area: {
    type: String,
  },
  city: {
    type: String,
    required: true, // City is now required
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },},
{ toJSON: { virtuals: true } });

locationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});


module.exports = mongoose.model('Location', locationSchema);
