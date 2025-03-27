// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    online: { type: Boolean, default: false }, // To track online status
});

module.exports = mongoose.model("User", userSchema);
