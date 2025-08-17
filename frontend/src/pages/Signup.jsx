import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify"; 
import 'react-toastify/dist/ReactToastify.css'; 
import { FiEye, FiEyeOff } from "react-icons/fi"; 

const Signup = () => {
    const [user, setUser] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false); 
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
    const navigate = useNavigate();

    // Handle Input Change
    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    // Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!user.username || !user.email || !user.password || !user.confirmPassword) {
        
            toast.error("⚠ Please fill in all fields."); 
            return;
        }

        if (user.password !== user.confirmPassword) {
            toast.error("⚠ Passwords do not match.");
            return;
        }

        try {
            const res = await axios.post("http://localhost:4000/api/auth", user);
            if (res.data.success) {
                toast.success("✅ Signup successful! Please login.");
                navigate("/"); 
            }
        } catch (err) {
          
            toast.error(err.response?.data?.message || "⚠ Signup failed. Please try again."); 
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Toggle confirm password visibility
    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow-lg p-4">
                        <h2 className="text-center mb-4">Signup</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Username</label>
                                <input type="text" name="username" className="form-control" value={user.username} onChange={handleChange} />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" name="email" className="form-control" value={user.email} onChange={handleChange} />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <div className="input-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        className="form-control"
                                        value={user.password}
                                        onChange={handleChange}
                                    />
                                    <span className="input-group-text" onClick={togglePasswordVisibility} style={{ cursor: "pointer" }}>
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Confirm Password</label>
                                <div className="input-group">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        className="form-control"
                                        value={user.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <span className="input-group-text" onClick={toggleConfirmPasswordVisibility} style={{ cursor: "pointer" }}>
                                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                    </span>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-100">Signup</button>
                        </form>

                        <p className="mt-3 text-center">
                            Already have an account? <a href="/">Login</a>
                        </p>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Signup;
