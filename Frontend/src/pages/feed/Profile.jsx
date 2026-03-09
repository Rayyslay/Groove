import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { FiHeart, FiMessageCircle, FiUserPlus, FiUserCheck } from "react-icons/fi";
import "./Profile.css";

const API = "http://localhost:5290";

export default function Profile() {
  const { user: me } = useAuth();
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwn = !id || (me && String(id) === String(me.id));

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const endpoint = isOwn
          ? `${API}/api/users/me`
          : `${API}/api/users/${id}`;
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch {
        setProfile(null);
      }
      setLoading(false);
    };
    if (isOwn && !me) return;
    fetchProfile();
  }, [id, isOwn, me, token]);

  const toggleFollow = async () => {
    if (!profile) return;
    try {
      const res = await axios.post(
        `${API}/api/users/${profile.id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile((p) => ({
        ...p,
        isFollowing: res.data.following,
        followerCount: res.data.following ? p.followerCount + 1 : p.followerCount - 1,
      }));
    } catch {
      /* ignore */
    }
  };

  if (loading) return <div className="profile-page"><p className="profile-loading">Loading...</p></div>;
  if (!profile) return <div className="profile-page"><p className="profile-loading">User not found.</p></div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profilePictureUrl ? (
            <img src={profile.profilePictureUrl} alt="" />
          ) : (
            <span>{(profile.username || "?")[0].toUpperCase()}</span>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username}</h1>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-bio">{profile.bio || "No bio yet."}</p>
          {!isOwn && me && (
            <button className={`profile-follow-btn${profile.isFollowing ? " following" : ""}`} onClick={toggleFollow}>
              {profile.isFollowing ? <><FiUserCheck size={16} /> Following</> : <><FiUserPlus size={16} /> Follow</>}
            </button>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-number">{profile.postCount ?? 0}</span>
          <span className="stat-label">Posts</span>
        </div>
        <div className="stat">
          <span className="stat-number">{profile.followerCount ?? 0}</span>
          <span className="stat-label">Followers</span>
        </div>
        <div className="stat">
          <span className="stat-number">{profile.followingCount ?? 0}</span>
          <span className="stat-label">Following</span>
        </div>
      </div>

      <div className="profile-posts-section">
        <h2>Posts</h2>
        {(!profile.posts || profile.posts.length === 0) ? (
          <p className="profile-empty">{isOwn ? "No posts yet. Share your first vibe!" : "No posts yet."}</p>
        ) : (
          <div className="profile-posts-grid">
            {profile.posts.map((post) => (
              <div key={post.id} className="profile-post-card">
                {post.mediaUrl && post.mediaType === "image" && (
                  <img src={post.mediaUrl} alt="" className="profile-post-media" />
                )}
                {post.mediaUrl && post.mediaType === "video" && (
                  <video src={post.mediaUrl} className="profile-post-media" />
                )}
                {post.textContent && <p className="profile-post-text">{post.textContent}</p>}
                <div className="profile-post-meta">
                  <span><FiHeart size={14} /> {post.likeCount ?? 0}</span>
                  <span><FiMessageCircle size={14} /> {post.commentCount ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
