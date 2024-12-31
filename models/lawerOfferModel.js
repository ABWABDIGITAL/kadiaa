const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the LawyerOffer schema
const lawyerOfferSchema = new Schema({
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  offerPrice: {
    type: Number,
    required: true
  },
  offerDesc: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, // Automatically manage createdAt and updatedAt
  toJSON: { virtuals: true, versionKey: false }, // Disable __v field and include virtuals
  toObject: { virtuals: true, versionKey: false }
});

// Create the model
const LawyerOffer = mongoose.model('LawyerOffer', lawyerOfferSchema);

module.exports = LawyerOffer;
