const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const voiceDir = path.join(__dirname, "../uploads/voices");
if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const voiceStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, voiceDir),
  filename: (req, file, cb) => cb(null, Date.now() + ".webm"),
});
const uploadVoice = multer({ storage: voiceStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// Upload voice
router.post("/upload-voice", uploadVoice.single("voice"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ url: `/uploads/voices/${req.file.filename}` });
});

// Upload image
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Send a message
router.post("/send", async (req, res) => {
  const { sender, receiver, content, type } = req.body;
  try {
    const newMessage = new Message({ sender, receiver, content, type: type || "text" });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Error saving message", error });
  }
});

// Get all messages between two users
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

// Mark a message as read
router.put("/read/:messageId", async (req, res) => {
  const { messageId } = req.params;
  try {
    const updatedMessage = await Message.findByIdAndUpdate(messageId, { read: true }, { new: true });
    if (!updatedMessage) return res.status(404).json({ message: "Message not found." });
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: "Error updating message status.", error });
  }
});

// Delete a single message
router.delete("/message/:messageId", async (req, res) => {
  try {
    const msg = await Message.findByIdAndDelete(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found." });
    // Delete image file from disk if it's an image message
    if (msg.type === "image" && msg.content) {
      const filename = msg.content.split("/uploads/")[1];
      if (filename) {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
    res.json({ success: true, messageId: req.params.messageId });
  } catch (error) {
    res.status(500).json({ message: "Error deleting message", error });
  }
});

// Delete multiple messages
router.post("/delete-many", async (req, res) => {
  const { messageIds } = req.body;
  try {
    const msgs = await Message.find({ _id: { $in: messageIds } });
    // Delete image files
    msgs.forEach(msg => {
      if (msg.type === "image" && msg.content) {
        const filename = msg.content.split("/uploads/")[1];
        if (filename) {
          const filePath = path.join(uploadDir, filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
    });
    await Message.deleteMany({ _id: { $in: messageIds } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error deleting messages", error });
  }
});

// Clear entire conversation
router.delete("/conversation/:userId/:receiverId", async (req, res) => {
  const { userId, receiverId } = req.params;
  try {
    const msgs = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    });
    msgs.forEach(msg => {
      if (msg.type === "image" && msg.content) {
        const filename = msg.content.split("/uploads/")[1];
        if (filename) {
          const filePath = path.join(uploadDir, filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
    });
    await Message.deleteMany({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error clearing conversation", error });
  }
});

module.exports = router;
