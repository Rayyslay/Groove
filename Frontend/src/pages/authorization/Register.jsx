import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    bio: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      <div className="input-group">
        <input required type="text" name="firstName" className="input" placeholder=" " onChange={handleChange} />
        <label className="user-label">First Name</label>
      </div>

      <div className="input-group">
        <input required type="text" name="lastName" className="input" placeholder=" " onChange={handleChange} />
        <label className="user-label">Last Name</label>
      </div>

      <div className="input-group">
        <input required type="text" name="username" className="input" placeholder=" " onChange={handleChange} />
        <label className="user-label">Username</label>
      </div>

      <div className="input-group">
        <input required type="email" name="email" className="input" placeholder=" " onChange={handleChange} />
        <label className="user-label">Email</label>
      </div>

      <div className="input-group">
        <input required type="password" name="password" className="input" placeholder=" " onChange={handleChange} />
        <label className="user-label">Password</label>
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
