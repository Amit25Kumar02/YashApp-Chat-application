/* eslint-disable no-unused-vars */
import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../chat/authContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { FiEye, FiEyeOff } from "react-icons/fi";
import './login.css';

// const APIURL = "https://yashapp-chat-application.onrender.com";
const APIURL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api`;

const Login = () => {
    const { setUser } = useContext(AuthContext);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem("token")) navigate("/chat");
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!phoneNumber || !password) { toast.error("Please fill in all fields."); return; }
        setLoading(true);
        try {
            const res = await axios.post(`${APIURL}/auth/login`, { phoneNumber, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            localStorage.setItem("myUserId", res.data.user.userId);
            setUser(res.data.user);
            toast.success("Login successful!");
            navigate("/chat");
        } catch {
            toast.error("Login failed! Please check your information.");
            setLoading(false);
        }
    };

    return (
        <div className="ln-page">
            <div className="container-fluid h-100">
                <div className="row justify-content-center align-items-center min-vh-100 py-4">
                    <div className="col-12 col-sm-9 col-md-6 col-lg-4 col-xl-3">
                        <div className="ln-card">

                            {/* Brand */}
                            <div className="ln-brand">
                                <div className="ln-brand-icon">💬</div>
                                <span className="ln-brand-name">YashApp</span>
                            </div>

                            <h2 className="ln-title">Welcome Back</h2>
                            <p className="ln-subtitle">Log in to your account to continue.</p>

                            <form onSubmit={handleLogin} noValidate>
                                <div className="ln-field">
                                    <label className="ln-label">Phone Number</label>
                                    <input
                                        type="tel" className="ln-input"
                                        placeholder="Enter phone number"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        inputMode="numeric" pattern="[0-9]*"
                                    />
                                </div>

                                <div className="ln-field">
                                    <label className="ln-label">Password</label>
                                    <div className="ln-pw-wrap">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="ln-input"
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span className="ln-eye" onClick={() => setShowPassword(p => !p)}>
                                            {showPassword ? <FiEyeOff /> : <FiEye />}
                                        </span>
                                    </div>
                                </div>

                                <button type="submit" className="ln-btn" disabled={loading}>
                                    {loading ? <span className="ln-spinner" /> : "Log In"}
                                </button>
                            </form>

                            <p className="ln-footer">
                                New user? <Link to="/signup">Sign up</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer theme="dark" position="top-right" />
        </div>
    );
};

export default Login;
