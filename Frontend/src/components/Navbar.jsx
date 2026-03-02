import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext"; 
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      
      {/* LEFT SIDE */}
      <Link to="/" className="navbar-logo">
        <img src="/src/assets/Images/GR.png" alt="Logo" />
        <span>oove</span>
      </Link>

      {/* RIGHT SIDE */}
      <div className="navbar-right">
        {user ? (
          // ✅ LOGGED IN STATE (Home + profile + temporary logout)
          <div className="navbar-logged-in">
            <Link to="/" className="navbar-link">
              Home
            </Link>

            <button className="profile-button">
              <img
                src="/src/assets/Images/user-icon.png"
                className="user-icon"
                alt="User"
              />
            </button>

            {/* Temporary logout button for development */}
            <button
              className="btn-primary"
              style={{ padding: "6px 12px", fontSize: "0.9rem" }}
              onClick={logout}
            >
              Logout
            </button>
          </div>
        ) : (
          // ✅ LOGGED OUT STATE
          <>
            <div className="navbar-links">
              <Link to="/login">Login</Link>
            </div>

            <Link to="/register" className="btn-primary">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}