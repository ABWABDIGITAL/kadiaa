// models/paymentTransaction.js
const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    user: {
      name: { type: String, required: true }, 
      email: { type: String, required: true }, 
      phone: { type: String, required: true } 
    },
    invoiceId: { 
      type: String, 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    currency: { 
      type: String, 
      required: true, 
      enum: ['USD', 'EUR', 'KWD', 'SAR', 'AED'], 
    },
    paymentMethod: { 
      type: String, 
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'myfatoorah'], 
      required: true 
    },
    transactionId: { 
      type: String, 
      required: true, 
      unique: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'refunded'], 
      default: 'pending' 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    paymentDetails: {
      paymentUrl: { type: String }, 
      receipt: { type: String }, 
      errorMessage: { type: String }, 
      additionalInfo: { type: Object } 
    }
  },
  {
    timestamps: true 
  }
);

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
module.exports = PaymentTransaction;
