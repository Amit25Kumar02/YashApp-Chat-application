const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");
const connectDB = require("./db");
const Users = require("./routes/authRoutes");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// ✅ Ensure Database is Connected Before Proceeding
connectDB()
    .then(() => console.log("✅ Database Connected Successfully"))
    .catch((err) => {
        console.error("❌ Database Connection Failed:", err);
        process.exit(1); // Stop execution if DB fails
    });

// ✅ Define chatRoutes AFTER io is initialized
const chatRoutes = require("./routes/chatRoutes")(io);

// ✅ API Routes
app.use("/api/auth", Users);
app.use("/api/chat", chatRoutes);

// 🌐 Store Online Users
let users = {}; // Store username to socketId mapping
let offlineMessages = {}; // Store messages for offline users temporarily

io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // User goes online
    socket.on("user-online", async (userId) => {
        try {
            // Update the user status in the database
            const user = await User.findByIdAndUpdate(userId, { online: true }, { new: true });
    
            if (user) {
                // Store the socket.id mapped to username
                users[user.username] = socket.id;
                console.log(`User ${user.username} is online`);
    
                // Emit the updated online users list to all connected clients
                io.emit("update-user-status", users);
    
                // Send any offline messages if available
                if (offlineMessages[user.username]) {
                    offlineMessages[user.username].forEach((message) => {
                        io.to(socket.id).emit("receiveMessage", message); // Send to the specific socket
                    });
    
                    // Clear offline messages after they have been delivered
                    offlineMessages[user.username] = [];
                }
            }
        } catch (err) {
            console.error("Error updating user online status:", err);
        }
    });
    
    // Handle message sending
    socket.on("sendMessage", async (message) => {
        console.log("Received message:", message);  // Add this line to log the data
    
        const { sender, receiver, content } = message;
    
        // Check if content exists
        if (!content) {
            console.error("Message content is missing!", message);
            return;
        }
    
        try {
            const newMessage = new Message({
                sender,
                receiver,
                content,
                msgDelivered: true,
            });
    
            await newMessage.save();
            console.log("Message saved:", newMessage);
        } catch (err) {
            console.error("Error:", err);
        }
    });
      
     // User disconnects (goes offline)
    socket.on("disconnect", async () => {
        for (let username in users) {
            if (users[username] === socket.id) {
                try {
                    // Update user status to offline in the database
                    const user = await User.findOneAndUpdate(
                        { username }, 
                        { online: false }, 
                        { new: true }
                    );
                    if (user) {
                        delete users[username]; // Remove the socket ID from the list
                        console.log(`User ${user.username} is offline`);

                        // Emit the updated online users list
                        io.emit("update-user-status", users);
                    }
                } catch (err) {
                    console.error("Error updating user offline status:", err);
                }
            }
        }
    });

    // 🎥 Video Call Events
    // Join room for video call
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);
        console.log(`📞 User ${userId} joined Room ${roomId}`);
    });

    // Handle video call offer
    socket.on("offer", (data) => {
        const { offer, from, to } = data;
        if (users[to]) {
            io.to(users[to]).emit("offer", { offer, from });
        }
    });

    // Handle video call answer
    socket.on("answer", (data) => {
        const { answer, to } = data;
        if (users[to]) {
            io.to(users[to]).emit("answer", { answer });
        }
    });

    // Handle ICE candidates
    socket.on("ice-candidate", (data) => {
        const { candidate, to } = data;
        if (users[to]) {
            io.to(users[to]).emit("ice-candidate", { candidate });
        }
    });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
