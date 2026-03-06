import { NavLink } from "react-router-dom";
import { FiHome, FiCompass, FiSearch, FiPlusSquare, FiUser, FiSettings } from "react-icons/fi";
import "./Sidebar.css";

const links = [
  { to: "/feed",       icon: <FiHome />,       label: "Feed" },
  { to: "/explore",    icon: <FiCompass />,     label: "Explore" },
  { to: "/search",     icon: <FiSearch />,      label: "Search" },
  { to: "/create-post",icon: <FiPlusSquare />,  label: "Post" },
  { to: "/profile",    icon: <FiUser />,        label: "Profile" },
  { to: "/settings",   icon: <FiSettings />,    label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
          >
            <span className="sidebar-icon">{icon}</span>
            <span className="sidebar-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
