const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "image", "video"], required: true },
    content: { type: String, required: true },
    caption: { type: String, default: "" },
    bgColor: { type: String, default: "#1e1e2e" },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now, expires: 86400 } // auto-delete after 24hrs
});

module.exports = mongoose.model("Status", statusSchema);
