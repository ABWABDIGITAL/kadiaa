const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
   // required: true,
  }, 
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lawyer",
   // required: true,
  },
  
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
   required: true,
  }, 
  
  
  timestamp: {
    type: Date,
    default: Date.now,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastMessageDate: {
    type: Date,
  },
});

// Middleware to update lastMessageDate before saving
chatSchema.pre('save', function(next) {
  if (this.isModified('lastMessage')) {
    this.lastMessageDate = new Date();
  }
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
