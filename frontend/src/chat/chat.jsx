/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext, useRef } from "react";
import AuthContext from "./authContext";
import { socket } from "./socket";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { FaSignOutAlt, FaVideo, FaSmile, FaArrowLeft } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, Link } from "react-router-dom";
import profileImage from "../assets/Amit_Photo.jpg";
import "./css/chat.css";

// Utility function to format the date and time
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (date >= today) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= yesterday) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString();
    }
};

const getUserAvatar = (user) => {
    const firstLetter = user.username?.charAt(0)?.toUpperCase();
    return (
        <div className="avatar-placeholder rounded-circle chat-img">
            {firstLetter}
        </div>
    );
};

const Chat = () => {
    const { user, setUser } = useContext(AuthContext);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [receiver, setReceiver] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [onlineUsers, setOnlineUsers] = useState({});
    const [userProfile, setUserProfile] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const chatRef = useRef(null);
    const navigate = useNavigate();

    // New state for mobile responsiveness
    const [showSidebar, setShowSidebar] = useState(true);

    // 1. Fetch user profile and load last active chat on component mount.
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }
        axios.get("http://localhost:4000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setUserProfile(res.data);
                const lastReceiverId = localStorage.getItem("lastReceiverId");
                const lastReceiverName = localStorage.getItem("lastReceiverName");
                if (lastReceiverId && lastReceiverName) {
                    setReceiverId(lastReceiverId);
                    setReceiverName(lastReceiverName);
                }
            })
            .catch(() => navigate("/"));
    }, []);

    // 2. Socket.io general listeners for user status
    useEffect(() => {
        if (userProfile._id) {
            socket.emit("user-online", userProfile._id);
            socket.on("update-user-status", setOnlineUsers);
        }
        return () => {
            socket.off("update-user-status");
        };
    }, [userProfile]);

    // 3. Handle incoming messages and fetch initial messages for a selected chat
    useEffect(() => {
        if (!userProfile._id || !receiverId) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.get(`http://localhost:4000/api/chat/messages/${receiverId}?userId=${userProfile._id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                setMessages(res.data);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
                setMessages([]);
            }
        };

        const handleReceiveMessage = (data) => {
            setMessages(prev => {
                if (data.sender === receiverId || data.receiver === receiverId) {
                    return [...prev, data];
                }
                return prev;
            });
            if (data.sender === receiverId) {
                socket.emit("markAsRead", { sender: data.sender, receiver: userProfile._id });
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);
        fetchMessages();

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [userProfile, receiverId]);

    // 4. Fetch all users
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const res = await axios.get("http://localhost:4000/api/auth/users", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                setAllUsers(res.data.filter(u => u._id !== userProfile._id));
            } catch (error) {
                console.error("Failed to fetch users:", error);
            }
        };
        if (userProfile._id) {
            fetchAllUsers();
        }
    }, [userProfile]);

    // 5. Mobile responsiveness logic
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setShowSidebar(true);
            } else {
                if (receiverId) {
                    setShowSidebar(false);
                } else {
                    setShowSidebar(true);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [receiverId]);

    const handleSelectChat = (selectedUser) => {
        localStorage.setItem("lastReceiverId", selectedUser._id);
        localStorage.setItem("lastReceiverName", selectedUser.username);
        setReceiver(selectedUser.username);
        setReceiverId(selectedUser._id);
        setReceiverName(selectedUser.username);
        setShowSidebar(false);
    };

    const handleBackClick = () => {
        setShowSidebar(true);
        setReceiverId("");
        setReceiverName("");
        setMessages([]);
    };

    const sendMessage = async () => {
        if (!message || !receiverId) {
            toast.error("Please select a user and type a message.");
            return;
        }
        const data = {
            sender: userProfile._id,
            receiver: receiverId,
            content: message,
            type: "text",
            createdAt: new Date().toISOString(),
        };
        try {
            await axios.post("http://localhost:4000/api/chat/send", data, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            socket.emit("sendMessage", data);
            setMessages((prev) => [...prev, data]);
            setMessage("");
            setShowEmojiPicker(false);
        } catch {
            toast.error("Message send failed");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        navigate("/");
        toast.info("Logged out");
    };

    // Auto-scroll to the bottom of the chat box.
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="whatsapp-container">
            <ToastContainer />
            <div className={`sidebar ${!showSidebar ? 'hide-on-mobile' : ''}`}>
                <div className="profile-header">
                    <img src={profileImage} alt="Profile" className="rounded-circle profile-img" />
                    <span>{userProfile.username}</span>
                    <button className="btn btn-logout" onClick={handleLogout}>
                        <FaSignOutAlt />
                    </button>
                </div>
                <div className="chat-list">
                    {allUsers.map((u) => (
                        <div key={u._id} className={`chat-item ${receiverId === u._id ? 'active' : ''}`} onClick={() => handleSelectChat(u)}>
                            {getUserAvatar(u)}
                            <div className="chat-info">
                                <span className="chat-name">{u.username}</span>
                                <small className={`status-dot ${onlineUsers[u._id] ? 'online' : 'offline'}`}></small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`chat-main ${showSidebar ? 'hide-on-mobile' : ''}`}>
                <div className="chat-header">
                    <div className="d-flex align-items-center">
                        {window.innerWidth <= 768 && !showSidebar && (
                            <button className="btn btn-back me-2" onClick={handleBackClick}>
                                <FaArrowLeft />
                            </button>
                        )}
                        {receiverId ? getUserAvatar({ username: receiverName }) : <img src={profileImage} alt="Receiver" className="rounded-circle me-2 chat-img" />}
                        <div className="chat-header-info">
                            <span className="fw-bold">{receiverName || "Select a chat"}</span>
                            <small className="text-muted">{receiverId && (onlineUsers[receiverId] ? "Online" : "Offline")}</small>
                        </div>
                    </div>
                    {receiverId && (
                        <Link to={{ pathname: "/video", state: { receiverId, receiverName } }} className="btn btn-video-call">
                            <FaVideo />
                        </Link>
                    )}
                </div>

                <div className="chat-box" ref={chatRef}>
                    {messages.length === 0 && (
                        <div className="empty-chat-message">
                            <p>No messages yet. Start a conversation!</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`message-bubble ${msg.sender === userProfile._id ? "sent" : "received"}`}>
                            <div className="message-content">
                                {msg.type === "image" ? (
                                    <img src={msg.content} alt="sent" className="message-image" />
                                ) : (
                                    <p>{msg.content}</p>
                                )}
                                <span className="message-time">{formatDate(msg.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="chat-input-area">
                    {showEmojiPicker && (
                        <EmojiPicker onEmojiClick={(emojiData) => setMessage(prev => prev + emojiData.emoji)} />
                    )}
                    <button className="btn btn-icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                        <FaSmile />
                    </button>
                    <input
                        className="form-control message-input"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message"
                        disabled={!receiverId}
                    />
                    <button className="btn btn-primary send-btn" onClick={sendMessage} disabled={!receiverId || !message}>
                        <svg viewBox="0 0 24 24" width="24" height="24" className="">
                            <path fill="currentColor" d="M1.101 21.757L23.8 12.028 1.101 2.3zM14.444 12L2.015 20.315 2.5 12 2.015 3.685z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;