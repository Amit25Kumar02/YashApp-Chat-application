import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  timeout: 10000,
});

socket.on("connect", () => console.log("🟢 Socket connected:", socket.id));
socket.on("disconnect", () => console.log("🔴 Socket disconnected"));
