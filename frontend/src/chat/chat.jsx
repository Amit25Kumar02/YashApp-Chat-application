import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "./authContext";
import { socket } from "./socket.jsx";
import axios from "axios";
import "./css/chat.css";
import { FaSignOutAlt, FaVideo } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Import profile image
import profileImage from '../assets/Amit_Photo.jpg';

const Chat = () => {
    const { user, setUser } = useContext(AuthContext);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [receiver, setReceiver] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [onlineUsers, setOnlineUsers] = useState({});
    const [userProfile, setUserProfile] = useState({});
    const chatRef = useRef(null);
    const navigate = useNavigate();

    // ✅ Fetch user data from token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.get("http://localhost:5000/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((res) => setUserProfile(res.data))
                .catch(() => navigate("/"));
        } else {
            navigate("/");
        }

        if (user?.userId) {
            socket.emit("user-online", user.userId);

            // ✅ Listen for online users
            socket.on("update-user-status", (users) => {
                setOnlineUsers(users);
            });

            // ✅ Listen for new messages
            socket.on("receiveMessage", (data) => {
                console.log("📨 Message received:", data);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: data.sender, receiver: data.receiver, content: data.content }
                ]);
            });

            return () => {
                socket.off("receiveMessage");
                socket.off("update-user-status");
            };
        }
    }, [user, navigate]);

    // ✅ Fetch receiver's details
    const fetchReceiverDetails = async (username) => {
        if (!username) {
            setReceiverName("");
            setReceiverId("");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:5000/api/auth/username/${username}`);
            if (res.data && res.data._id) {
                setReceiverName(res.data.username);
                setReceiverId(res.data._id);
            } else {
                setReceiverName("User Not Found");
                setReceiverId("");
            }
        } catch (error) {
            console.error("Error fetching receiver:", error);
            setReceiverName("User Not Found");
            setReceiverId("");
        }
    };

    // ✅ Handle receiver input change
    const handleReceiverChange = (e) => {
        const value = e.target.value.trim();
        setReceiver(value);
        fetchReceiverDetails(value);
    };

    // ✅ Send message
    const sendMessage = async () => {
        if (!message || !receiverId) {
            alert("Message content and receiver are required.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/chat/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    sender: user.userId,
                    receiver: receiverId,
                    content: message,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Error sending message:", data);
                alert(data.message || "Failed to send message");
                return;
            }

            console.log("✅ Message sent successfully:", data);

            // ✅ Emit the message to the receiver using socket
            socket.emit("sendMessage", {
                sender: user.userId,
                receiver: receiverId,
                content: message,
            });

            // ✅ Update state instantly
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: user.userId, receiver: receiverId, content: message },
            ]);

            setMessage(""); // Clear input after sending
        } catch (error) {
            console.error("❌ Network error:", error);
        }
    };

    // ✅ Handle Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
        toast.info("⚠ Logged out successfully.");
    };

    // ✅ Scroll to the latest message when messages change
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    // ✅ Reset messages when the receiver changes
    useEffect(() => {
        setMessages([]);
    }, [receiverId]);

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                    {/* Profile image */}
                    <img
                        src={profileImage}
                        alt="Profile"
                        className="rounded-circle me-2"
                        width="40"
                        height="40"
                    />
                    <span className="fw-bold">{userProfile.username || "Guest"}</span>
                </div>
                <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                    <FaSignOutAlt />
                </button>
            </div>

            <div className="mt-3">
                <Link to="/video" className="btn btn-warning icon-btn">
                    <FaVideo />
                </Link>
            </div>

            <h1 className="chat-header">
                <span className="app-name">Yash</span><span className="app-tagline">App</span>
            </h1>

            <div className="card p-3">
                <h5>📌 Online Users</h5>
                <ul className="list-group">
                    {Object.entries(onlineUsers).map(([username]) => (
                        <li
                            key={username}
                            className="list-group-item d-flex justify-content-between align-items-center"
                            onClick={() => handleReceiverChange({ target: { value: username } })}
                            style={{ cursor: "pointer" }}
                        >
                            {username} <span className="badge bg-success">✅ Online</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mb-3">
                <input
                    className="form-control"
                    type="text"
                    placeholder="Receiver Username"
                    value={receiver}
                    onChange={handleReceiverChange}
                />
                {receiverName && <p className="text-muted">Chatting with: {receiverName}</p>}
            </div>

            <div className="chat-box p-3 border rounded" style={{ height: "300px", overflowY: "auto" }} ref={chatRef}>
                {messages.map((msg, index) => (
                    <p key={index} className={msg.sender === user.userId ? "text-end" : "text-start"}>
                        <b>{msg.sender === user.userId ? "Me" : receiverName}:</b> {msg.content}
                    </p>
                ))}
            </div>

            <div className="input-group mt-3 mb-5">
                <input
                    className="form-control"
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button className="btn btn-primary" onClick={sendMessage}>Send</button>
            </div>

            {/* Toast container */}
            <ToastContainer />
        </div>
    );
};

export default Chat;
