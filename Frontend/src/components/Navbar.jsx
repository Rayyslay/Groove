import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/" style={{overflow: "hidden"}}>
          <img src="../src/assets/Images/GR.png" alt="Logo" style={{ width: "24px", height: "24px", marginRight: "10px", scale: "3" }} />
          <p style={{ fontSize: "24px", fontWeight: "bold", alignItems: "center", display: "inline-block" }}>oove</p>
        </a>
      </div>

      <div className="navbar-links">
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
}