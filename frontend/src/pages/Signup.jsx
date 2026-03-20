import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { FiEye, FiEyeOff } from "react-icons/fi";
import './signup.css';

const APIURL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api`;

const Signup = () => {
    const [user, setUser] = useState({
        username: "", phoneNumber: "", email: "", password: "", confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    const validatePassword = (pw) => {
        if (pw.length < 6) return "Password must be at least 6 characters.";
        if (pw.length > 10) return "Password must be at most 10 characters.";
        if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
        if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
        if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
        if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain at least one special character.";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!user.username || !user.phoneNumber || !user.email || !user.password || !user.confirmPassword) {
            toast.error("Please fill in all fields."); return;
        }
        const pwErr = validatePassword(user.password);
        if (pwErr) { toast.error(pwErr); return; }
        if (user.password !== user.confirmPassword) {
            toast.error("Passwords do not match."); return;
        }
        setLoading(true);
        try {
            await axios.post(`${APIURL}/auth`, user);
            toast.success("Signup successful! Please login.");
            navigate("/");
        } catch (err) {
            toast.error(err.response?.data?.message || "Signup failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="su-page">
            <div className="su-card">

                <div className="su-brand">
                    <div className="su-brand-icon">💬</div>
                    <span className="su-brand-name">YashApp</span>
                </div>

                <h2 className="su-title">Create an Account</h2>
                <p className="su-subtitle">Join us and start connecting with friends.</p>

                <form onSubmit={handleSubmit} noValidate>

                    <div className="su-field">
                        <label className="su-label">Username</label>
                        <input type="text" name="username" className="su-input"
                            value={user.username} onChange={handleChange}
                            placeholder="e.g., Amit Kumar" />
                    </div>

                    <div className="su-field">
                        <label className="su-label">Phone Number</label>
                        <input type="tel" name="phoneNumber" className="su-input"
                            value={user.phoneNumber} onChange={handleChange}
                            placeholder="e.g., 9876543210"
                            inputMode="numeric" pattern="[0-9]*" />
                    </div>

                    <div className="su-field">
                        <label className="su-label">Email</label>
                        <input type="email" name="email" className="su-input"
                            value={user.email} onChange={handleChange}
                            placeholder="e.g., example@gmail.com" />
                    </div>

                    <div className="su-field">
                        <label className="su-label">Password</label>
                        <div className="su-pw-wrap">
                            <input type={showPassword ? "text" : "password"}
                                name="password" className="su-input"
                                value={user.password} onChange={handleChange}
                                placeholder="6-10 chars, A-Z, a-z, 0-9, @#$" />
                            <span className="su-eye" onClick={() => setShowPassword(p => !p)}>
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </span>
                        </div>
                    </div>

                    <div className="su-field">
                        <label className="su-label">Confirm Password</label>
                        <div className="su-pw-wrap">
                            <input type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword" className="su-input"
                                value={user.confirmPassword} onChange={handleChange}
                                placeholder="Confirm your password" />
                            <span className="su-eye" onClick={() => setShowConfirmPassword(p => !p)}>
                                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </span>
                        </div>
                    </div>

                    <button type="submit" className="su-btn" disabled={loading}>
                        {loading ? <span className="su-spinner" /> : "Sign Up"}
                    </button>
                </form>

                <p className="su-footer">
                    Already have an account? <Link to="/">Log In</Link>
                </p>
            </div>
            <ToastContainer theme="dark" position="top-right" />
        </div>
    );
};

export default Signup;
