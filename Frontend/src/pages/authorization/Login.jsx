import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import "./auth.css";
import "./Register.css";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5290"}/api/auth/login`,
        formData
      );

      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      addToast("Login successful!", "success");
      navigate("/feed");

    } catch (err) {
      addToast("Invalid email or password.", "error");
    }
  };

return (
  <div className="auth-page">
    <div className="glass-card">
      <h2 style={{ marginBottom: "30px" }}>Login</h2>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input required type="email" name="email" className="input" placeholder=" " onChange={handleChange} />
          <label className="user-label">Email</label>
        </div>

        <div className="input-group password-group" style={{ position: "relative" }}>
          <input required type={showPassword ? "text" : "password"} name="password" className="input" placeholder=" " onChange={handleChange} />
          <span
            className="password-toggle"
            onClick={() => setShowPassword(prev => !prev)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </span>
          <label className="user-label">Password</label>
        </div>

        <button type="submit">Login</button>
        <p className="auth-switch">
          Don't have an account?
          <span onClick={() => navigate("/register")} className="login-link"> Sign up</span>
        </p>
      </form>
    </div>
  </div>
);


}