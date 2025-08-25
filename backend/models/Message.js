const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'emoji'], default: 'text' },
  read: { type: Boolean, default: false },
  tempId: { type: String }, // Add tempId field for duplicate prevention
  createdAt: { type: Date, default: Date.now }
});

// Add index for tempId to quickly find duplicates
messageSchema.index({ tempId: 1 }, { unique: true, sparse: true });

// Add index for performance (querying messages between users)
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

// Add index for checking recent duplicates (for fallback duplicate prevention)
messageSchema.index({ 
  sender: 1, 
  receiver: 1, 
  content: 1, 
  createdAt: 1 
});

module.exports = mongoose.model('Message', messageSchema);