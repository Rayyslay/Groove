import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiUserPlus, FiUserCheck } from "react-icons/fi";
import "./Search.css";

const API = "http://localhost:5290";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await axios.get(`${API}/api/users/search`, {
        params: { q: query.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch {
      setResults([]);
    }
    setSearched(true);
  };

  const toggleFollow = async (userId) => {
    try {
      const res = await axios.post(
        `${API}/api/users/${userId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: res.data.following } : u
        )
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="search-page">
      <h1 className="search-heading">Search</h1>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search users by name or username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">Search</button>
      </form>

      <div className="search-results">
        {results.map((u) => (
          <div key={u.id} className="search-user-card">
            <Link to={`/profile/${u.id}`} className="search-user-info">
              <div className="search-avatar">
                {u.profilePictureUrl ? (
                  <img src={u.profilePictureUrl} alt="" />
                ) : (
                  <span>{(u.username || "?")[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="search-name">{[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username}</p>
                <p className="search-username">@{u.username}</p>
              </div>
            </Link>

            {user && u.id !== user.id && (
              <button
                className={`follow-btn${u.isFollowing ? " following" : ""}`}
                onClick={() => toggleFollow(u.id)}
              >
                {u.isFollowing ? (
                  <><FiUserCheck size={16} /> Following</>
                ) : (
                  <><FiUserPlus size={16} /> Follow</>
                )}
              </button>
            )}
          </div>
        ))}

        {searched && results.length === 0 && (
          <p className="no-results">No users found.</p>
        )}
      </div>
    </div>
  );
}
