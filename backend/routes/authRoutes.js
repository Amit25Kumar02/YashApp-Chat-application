const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json()); // Middleware for parsing JSON

// Register Route
app.post("/", async (req, res) => {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Create a new user without hashing password (Not recommended for production)
    const newUser = new User({ username, email, password });

    try {
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(400).json({ message: "Error registering user", error });
    }
});

// Get User Info Route (Protected)
app.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]; // Extract Bearer Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use JWT_SECRET from .env
        const user = await User.findById(decoded.id).select("-password"); // Get User Data (Without Password)
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
});
app.get("/username/:username", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ _id: user._id, username: user.username });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Login Route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).json({ message: "Invalid username" });
    }

    // Check if the password matches (in plain text)
    if (user.password !== password) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token,user:{ userId: user._id, username: user.username} });
});

module.exports = app;
