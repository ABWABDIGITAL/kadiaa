const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const caseSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  caseType: {
     type: mongoose.Schema.Types.ObjectId,
      ref: 'CaseType',
      required: true,
    },
  
  description: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: false,
  },
  status: {
    type: String,
    default: 'pending',
  },
  price: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  caseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  entity: {
    type: String,
    required: true,
  },
  nextSession: {
    type: Date,
    required: false,
  },
  defendant: {
    type: String,
    required: false,
  },
  defendantId: {
    type: String, // Assuming this stores a URL or path to a file related to the defendant
    required: false,
  },
  claimant: {
    type: String,
    required: false,
  },
  claimantId: {
    type: String, // Assuming this stores a URL or path to a file related to the claimant
    required: false,
  },
  powerOfAttorney: {
    type: String, // Assuming this stores a URL or path to a file related to the power of attorney
    required: false,
  },
  caseFiles: [
    {
      type: String, // URL or path to the file
      required: false,
    },
  ],
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false, // or true if it's mandatory for all cases
  },
}, { toJSON: { virtuals: true } });

caseSchema.index({ description: 'text', caseType: 'text' });

caseSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Case', caseSchema);
