const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// ✅ Send a message (saves to DB) - Fixed duplicate issue
router.post("/send", async (req, res) => {
  const { sender, receiver, content, tempId } = req.body;
  
  try {
    // Check for duplicate message in the last 2 seconds
    const duplicate = await Message.findOne({
      sender,
      receiver,
      content,
      createdAt: { $gte: new Date(Date.now() - 2000) } // Check last 2 seconds
    });
    
    if (duplicate) {
      // If duplicate exists, return it instead of creating a new one
      return res.status(200).json(duplicate);
    }
    
    // Create and save the new message
    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Error saving message", error });
  }
});

// ✅ Get all messages between two users
router.get("/messages/:receiverId", async (req, res) => {
  const { receiverId } = req.params;
  const { userId } = req.query;
  
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
});

module.exports = router;