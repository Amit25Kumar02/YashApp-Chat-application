const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
// const User = require("../models/User");

module.exports = (io) => {
  // ✅ Send a message (Ensure `content` exists)
router.post("/send", async (req, res) => {
    const { sender, receiver, content } = req.body;

    // ✅ Check if all fields exist
    if (!sender || !receiver || !content) {
        return res.status(400).json({ message: "All fields (sender, receiver, content) are required." });
    }

    try {
        const newMessage = new Message({ sender, receiver, content });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: "Error saving message", error });
    }
});
    return router;
};
