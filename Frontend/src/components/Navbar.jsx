import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext"; 
import "./Navbar.css";

const DEFAULT_AVATAR = "/assets/profilePictures/default-avatar.jpg";

export default function Navbar() {
  const { user } = useContext(AuthContext);

  return (
    <nav className="navbar">
      
      {/* LEFT SIDE */}
      <Link to="/" className="navbar-logo">
        <img src="/assets/GR.webp" alt="Logo" />
        <span>oove</span>
      </Link>

      {/* RIGHT SIDE */}
      <div className="navbar-right">
        {user ? (
          <div className="navbar-logged-in">
            <Link to="/" className="navbar-link">
              Home
            </Link>
            <Link to="/feed" className="navbar-link">
              Feed
            </Link>

            <Link to="/profile" className="profile-button">
              <img
                src={user.profilePictureUrl || DEFAULT_AVATAR}
                className="user-icon"
                alt="Profile"
              />
            </Link>
          </div>
        ) : (
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