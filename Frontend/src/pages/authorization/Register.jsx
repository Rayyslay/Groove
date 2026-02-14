import { useState } from "react";
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

  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState(0);
  const [usernameExists, setUsernameExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const strengthColors = ["red", "red", "orange", "yellow", "lightgreen", "green"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedValue = name === "username" ? value.toLowerCase() : value;

    setFormData({
      ...formData,
      [name]: updatedValue
    });

    if (name === "password") {
      setStrength(calculatePasswordStrength(updatedValue));
    }
  };

  const checkUsername = async () => {
    if (!usernameRegex.test(formData.username)) return;

    const res = await axios.get(
      `https://localhost:5001/api/auth/check-username?username=${formData.username}`
    );
    setUsernameExists(res.data.exists);
  };

  const checkEmail = async () => {
    if (!emailRegex.test(formData.email)) return;

    const res = await axios.get(
      `https://localhost:5001/api/auth/check-email?email=${formData.email}`
    );
    setEmailExists(res.data.exists);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    // Required field check
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

    if (strength < 3)
      newErrors.password = "Password is too weak";

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (usernameExists)
      newErrors.username = "Username already taken";

    if (emailExists)
      newErrors.email = "Email already registered";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      await axios.post("https://localhost:5001/api/users/register", formData);
      alert("User created successfully");
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

        <div className="input-group">
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