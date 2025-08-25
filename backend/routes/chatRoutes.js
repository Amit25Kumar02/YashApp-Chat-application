const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// ✅ Send a message (saves to DB) - Fixed duplicate issue
router.post("/send", async (req, res) => {
  const { sender, receiver, content, tempId } = req.body;
  
  try {
    // First check if a message with this tempId already exists (primary duplicate check)
    if (tempId) {
      const existingMessage = await Message.findOne({ tempId });
      if (existingMessage) {
        return res.status(200).json(existingMessage);
      }
    }
    
    // Secondary check: Look for content duplicates in the last 2 seconds
    const duplicateContent = await Message.findOne({
      sender,
      receiver,
      content,
      createdAt: { $gte: new Date(Date.now() - 2000) }
    });
    
    if (duplicateContent) {
      return res.status(200).json(duplicateContent);
    }
    
    // Create and save the new message with tempId
    const newMessage = new Message({ 
      sender, 
      receiver, 
      content,
      tempId // Store the temporary ID to prevent future duplicates
    });
    
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    // Handle duplicate key error (if tempId is already used)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.tempId) {
      // If it's a duplicate tempId, find and return the existing message
      const existingMessage = await Message.findOne({ tempId });
      if (existingMessage) {
        return res.status(200).json(existingMessage);
      }
    }
    res.status(500).json({ message: "Error saving message", error: error.message });
  }
});

// ✅ Get all messages between two users
router.get("/messages/:receiverId", async (req, res) => {
  const { receiverId } = req.params;
  const { userId } = req.query;
  
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }
  
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
});

// ✅ Mark messages as read
router.put("/markAsRead", async (req, res) => {
  const { sender, receiver } = req.body;
  
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }
  
  try {
    await Message.updateMany(
      { sender, receiver, read: false },
      { $set: { read: true } }
    );
    
    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking messages as read", error: error.message });
  }
});

module.exports = router;