import { io } from "socket.io-client";

// Define the Socket.IO server URL
// const SOCKET_URL = "http://localhost:4000";  
const SOCKET_URL = "https://yashapp-chat-application.onrender.com"; 

// Connect to the Socket.IO server
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  timeout: 10000,
});

// ✅ Emit "user-online" if user is logged in
const savedUser = JSON.parse(localStorage.getItem("user"));
const userId = savedUser?.userId;

if (userId) {
  console.log("📡 Emitting user-online:", userId);
  socket.emit("user-online", userId);
} else {
  console.warn("⚠️ No userId found in localStorage");
}

// ✅ Receive message listener
socket.on("receiveMessage", (message) => {
  console.log("📩 Received message:", message);
});

// ✅ Optional test sendMessage function
export const sendMessage = (receiver, content = "Hello!") => {
  socket.emit("sendMessage", { receiver, content });
};

// ✅ Socket events
socket.on("connect", () => {
  console.log("🟢 Connected to Socket.IO Server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 Disconnected from server");
});
