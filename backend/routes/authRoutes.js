const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();

const avatarDir = path.join(__dirname, "../uploads/avatars");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Register
app.post("/", async (req, res) => {
    const { username, phoneNumber, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) return res.status(400).json({ message: "User already exists" });
        const newUser = new User({ username, phoneNumber, email, password });
        await newUser.save();
        res.status(200).json({ message: "✅ User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Login
app.post("/login", async (req, res) => {
    const { phoneNumber, password } = req.body;
    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(400).json({ message: "Invalid phone number" });
        if (user.password !== password) return res.status(400).json({ message: "Invalid password" });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
        res.json({ token, user: { userId: user._id, username: user.username, phoneNumber: user.phoneNumber } });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get logged-in user
app.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
});

// Upload / update avatar
app.put("/avatar", upload.single("avatar"), async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        // Delete old avatar file if exists
        const existing = await User.findById(decoded.id);
        if (existing.avatar) {
            const oldPath = path.join(__dirname, "../", existing.avatar);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(decoded.id, { avatar: avatarUrl }, { new: true }).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error updating avatar" });
    }
});

// Get user by username
app.get("/username/:username", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ _id: user._id, username: user.username });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all users
app.get("/users", async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET);
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
});

module.exports = app;
