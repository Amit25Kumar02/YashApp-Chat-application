const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'emoji'], default: 'text' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Add compound index to prevent duplicate messages
messageSchema.index(
  { 
    sender: 1, 
    receiver: 1, 
    content: 1, 
    createdAt: 1 
  }, 
  { 
    unique: true,
    partialFilterExpression: {
      type: 'text' // Only enforce uniqueness for text messages
    }
  }
);

module.exports = mongoose.model('Message', messageSchema);