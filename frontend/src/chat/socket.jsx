import { io } from "socket.io-client";

// Define the Socket.IO server URL
const SOCKET_URL = "http://localhost:5000";  

// Connect to the Socket.IO server
export const socket = io(SOCKET_URL, {
    transports: ["websocket"],  // Use WebSocket transport
    reconnectionAttempts: 5,    // Retry 5 times if the connection fails
    timeout: 10000,             // Timeout for connection attempts
});

// Emit when the user is online (triggered when user logs in or connects)
const userId = "your_user_id";  // Replace with actual user ID
socket.emit("user-online", userId);

// Listen for incoming messages from the server
socket.on("receiveMessage", (message) => {
    console.log("Received message:", message);
});

// Send a message to another user
// eslint-disable-next-line no-unused-vars
const sendMessage = (receiver) => {
    socket.emit("sendMessage", { receiver, content: "Hello!" });
};

// Listen for the connection event
socket.on("connect", () => {
    console.log("✅ Connected to Socket.IO Server:", socket.id);
});

// Listen for the disconnection event
socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
});
