import { useState } from "react";
import Toast from "../../components/Toast";
import axios from "axios";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5290/api/auth/login",
        formData
      );
    
      localStorage.setItem("token", response.data.token);
    
      setToast({ message: "Login successful!", type: "success" });
    
    } catch (err) {
      setToast({ message: "Invalid email or password.", type: "error" });
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

        <div className="input-group">
          <input required type="password" name="password" className="input" placeholder=" " onChange={handleChange} />
          <label className="user-label">Password</label>
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
    {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    )}
  </div>
);


}