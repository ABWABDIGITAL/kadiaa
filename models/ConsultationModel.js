const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const consultationSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  caseTypes: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseType',
    required: true
  },
  lawyerOffers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LawyerOffer'
  }],
  offerCount: { 
    type: Number, 
    default: 0 
  },
  selectedOffer: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LawyerOffer'
  },
  lawyerId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer'
  },
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rejectedOffers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LawyerOffer' 
  }],
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  price: {
    type: Number
  },
  attachedFiles: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
    default: 'Pending'
  },
  statusHistory: [{ 
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  history: [{ 
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: { 
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true, versionKey: false }, 
  toObject: { virtuals: true, versionKey: false },
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

// Middleware to automatically add a status change to statusHistory
consultationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});


const Consultation = mongoose.model('Consultation', consultationSchema);

module.exports = Consultation;
