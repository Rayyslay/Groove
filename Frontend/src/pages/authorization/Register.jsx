import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext"; // adjust path if needed
import axios from "axios";

const nameRegex = /^[A-Za-z]{2,}$/;
const usernameRegex = /^[a-z0-9_]{4,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const calculatePasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: ""
  });

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState(0);
  const [usernameExists, setUsernameExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const [showPopup, setShowPopup] = useState(false);

  const strengthColors = ["red", "red", "orange", "yellow", "lightgreen", "green"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === "username" ? value.toLowerCase() : value;

    setFormData({
      ...formData,
      [name]: updatedValue
    });

    if (name === "password") {
      const checks = getPasswordRequirements(updatedValue);
      setPasswordChecks(checks);
      setStrength(calculatePasswordStrength(updatedValue));

      // Show popup only if at least one requirement is unmet
      setShowPopup(Object.values(checks).some(v => !v));
    }
  };

  const getPasswordRequirements = (password) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  });

  const checkUsername = async () => {
    if (!usernameRegex.test(formData.username)) return;

    const res = await axios.get(
      `http://localhost:5290/api/auth/check-username?username=${formData.username}`
    );
    setUsernameExists(res.data.exists);
  };

  const checkEmail = async () => {
    if (!emailRegex.test(formData.email)) return;

    const res = await axios.get(
      `http://localhost:5290/api/auth/check-email?email=${formData.email}`
    );
    setEmailExists(res.data.exists);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      newErrors.general = "All required fields must be filled.";
    }

    if (!nameRegex.test(formData.firstName))
      newErrors.firstName = "Invalid first name";

    if (!nameRegex.test(formData.lastName))
      newErrors.lastName = "Invalid last name";

    if (!usernameRegex.test(formData.username))
      newErrors.username = "Username must be lowercase, min 4 characters, no spaces";

    if (!emailRegex.test(formData.email))
      newErrors.email = "Invalid email format";

    // Password requirements
    const unmet = Object.values(passwordChecks).some(v => !v);
    if (unmet)
      newErrors.password = "Password does not meet requirements";

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (usernameExists)
      newErrors.username = "Username already taken";

    if (emailExists)
      newErrors.email = "Email already registered";

    setErrors(newErrors);

    // Only keep popup if password issues exist
    setShowPopup(unmet);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await axios.post(
        "http://localhost:5290/api/auth/register",
        formData
      );

      // 🔐 AUTO LOGIN RIGHT HERE
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      setShowPopup(false);
      navigate("/"); // redirect to homepage

      } catch (err) {
        console.error(err);
        alert("Registration failed");
      }
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: "30px" }}>Register</h2>

      <form onSubmit={handleSubmit}>
        {errors.general && <span className="error-text">{errors.general}</span>}

        <div className="input-group">
          <input required type="text" name="firstName" className="input" placeholder=" " onChange={handleChange} />
          <label className="user-label">First Name <span className="required">*</span></label>
          {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>

        <div className="input-group">
          <input required type="text" name="lastName" className="input" placeholder=" " onChange={handleChange} />
          <label className="user-label">Last Name <span className="required">*</span></label>
          {errors.lastName && <span className="error-text">{errors.lastName}</span>}
        </div>

        <div className="input-group">
          <input required type="text" name="username" className="input" placeholder=" " onChange={handleChange} onBlur={checkUsername}/>
          <label className="user-label">Username <span className="required">*</span></label>
          {usernameExists && <span className="error-text">Username already taken</span>}
          {errors.username && <span className="error-text">{errors.username}</span>}
        </div>

        <div className="input-group">
          <input required type="email" name="email" className="input" placeholder=" " onChange={handleChange} onBlur={checkEmail}/>
          <label className="user-label">Email <span className="required">*</span></label>
          {emailExists && <span className="error-text">Email already registered</span>}
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="input-group password-group" style={{ position: "relative" }}>
          <input required type="password" name="password" className="input" placeholder=" " onChange={handleChange} />
          <label className="user-label">Password <span className="required">*</span></label>

          <div className="strength-bar">
            <div
              className="strength-fill"
              style={{
                width: `${strength * 20}%`,
                background: strengthColors[strength]
              }}
            ></div>
          </div>

          {errors.password && <span className="error-text">{errors.password}</span>}

          {/* POPUP */}
          {showPopup && (
            <div className="password-popup animate-popup">
              <Requirement label="Minimum 8 characters" met={passwordChecks.length} />
              <Requirement label="At least one uppercase letter" met={passwordChecks.uppercase} />
              <Requirement label="At least one lowercase letter" met={passwordChecks.lowercase} />
              <Requirement label="At least one number" met={passwordChecks.number} />
              <Requirement label="At least one special character" met={passwordChecks.special} />
            </div>
          )}
        </div>

        <div className="input-group">
          <input required type="password" name="confirmPassword" className="input" placeholder=" " onChange={handleChange} />
          <label className="user-label">Confirm Password <span className="required">*</span></label>
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>

        <div className="input-group">
          <textarea name="bio" className="input" placeholder=" " onChange={handleChange}></textarea>
          <label className="user-label">Bio</label>
        </div>

        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}

function Requirement({ label, met }) {
  return (
    <div className="requirement-item">
      <span className={met ? "check" : "cross"}>
        {met ? "✔" : "✖"}
      </span>
      <span>{label}</span>
    </div>
  );
}
