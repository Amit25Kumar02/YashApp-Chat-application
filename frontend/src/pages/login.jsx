import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../chat/authContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 
import { FiEye, FiEyeOff } from "react-icons/fi"; 

const Login = () => {
    const { setUser } = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate(); 

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error("⚠ Please fill in all fields."); 
            return;
        }

        try {
            const res = await axios.post("http://localhost:4000/api/auth/login", { username, password });

            // ✅ Save Token and user in LocalStorage
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            // ✅ Set User Context
            setUser(res.data.user);

            toast.success("✅ Login successful!"); 
            navigate("/chat"); 
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("❌ Login failed! Please enter correct information."); 
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card shadow-lg p-4">
                        <h2 className="text-center mb-4">Login</h2>

                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label className="form-label">Username</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Enter Username" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <div className="input-group">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        className="form-control" 
                                        placeholder="Enter Password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                    />
                                    <span className="input-group-text" onClick={togglePasswordVisibility} style={{ cursor: "pointer" }}>
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </span>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-100">Login</button>
                        </form>

                        <p className="mt-3 text-center">
                            New user? <a href="/signup">Sign up</a>
                        </p>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Login;
