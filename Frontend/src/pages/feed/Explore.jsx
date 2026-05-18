import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { FiUserPlus, FiUserCheck, FiChevronLeft, FiChevronRight, FiHeart, FiMessageCircle } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Loader from "../../components/Loader";
import VideoPlayer from "../../components/VideoPlayer";
import PostModal from "../../components/PostModal";
import "./Explore.css";
import "./Feed.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5290";
const DEFAULT_AVATAR = "/assets/profilePictures/default-avatar.jpg";

// Module-level — avoids react-hooks/purity complaint about Date.now() during render
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Explore() {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [activePost, setActivePost] = useState(null);

  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const pageRef = useRef(1);
  const scrollRef = useRef(null);

  useEffect(() => {
    const authHeaders = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, postsRes] = await Promise.all([
          axios.get(`${API}/api/users/search`, {
            params: { excludeSelf: true },
            headers: authHeaders,
          }),
          axios.get(`${API}/api/posts/explore?page=1&size=20`, { headers: authHeaders }),
        ]);
        setUsers(usersRes.data);
        setPosts(postsRes.data.posts);
        setHasMore(postsRes.data.hasMore);
      } catch {
        /* ignore */
      }
      setIsLoading(false);
    };

    pageRef.current = 1;
    fetchData();
  }, [token]);

  const toggleFollow = async (userId) => {
    try {
      const res = await axios.post(`${API}/api/users/${userId}/follow`, {}, { headers });
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, isFollowing: res.data.following } : u)
      );
    } catch { /* ignore */ }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`${API}/api/posts/${postId}/like`, null, { headers });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLiked: res.data.liked, likeCount: res.data.likeCount } : p
        )
      );
      setActivePost((prev) =>
        prev?.id === postId
          ? { ...prev, isLiked: res.data.liked, likeCount: res.data.likeCount }
          : prev
      );
    } catch { /* ignore */ }
  };

  const handlePostUpdate = (updated) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setActivePost(updated);
  };

  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const next = pageRef.current + 1;
        pageRef.current = next;
        (async () => {
          setIsLoading(true);
          try {
            const authHeaders = { Authorization: `Bearer ${token}` };
            const res = await axios.get(
              `${API}/api/posts/explore?page=${next}&size=20`,
              { headers: authHeaders }
            );
            setPosts((prev) => [...prev, ...res.data.posts]);
            setHasMore(res.data.hasMore);
          } catch { /* ignore */ }
          setIsLoading(false);
        })();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, token]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 260, behavior: "smooth" });
    }
  };

  return (
    <div className="explore-page">
      <h1 className="explore-heading">Explore</h1>
      <p className="explore-subtext">Discover new people and trending posts</p>

      {/* ── Horizontal accounts section ── */}
      {users.length > 0 && (
        <div className="explore-accounts-section">
          <div className="explore-accounts-header">
            <h2>Suggested Accounts</h2>
            <div className="explore-scroll-btns">
              <button onClick={() => scroll(-1)} className="scroll-btn" aria-label="Scroll left" type="button">
                <FiChevronLeft />
              </button>
              <button onClick={() => scroll(1)} className="scroll-btn" aria-label="Scroll right" type="button">
                <FiChevronRight />
              </button>
            </div>
          </div>
          <div className="explore-accounts-track" ref={scrollRef}>
            {users.map((u) => (
              <div key={u.id} className="explore-card">
                <Link to={`/profile/${u.username}`} className="explore-card-link">
                  <div className="explore-card-avatar">
                    <img src={u.profilePictureUrl || DEFAULT_AVATAR} alt="" />
                  </div>
                  <span className="explore-card-name">
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username}
                  </span>
                  <span className="explore-card-bio">@{u.username}</span>
                </Link>
                {user && u.id !== user.id && (
                  <button
                    className={`explore-follow-btn${u.isFollowing ? " following" : ""}`}
                    onClick={() => toggleFollow(u.id)}
                  >
                    {u.isFollowing
                      ? <><FiUserCheck size={14} /> Following</>
                      : <><FiUserPlus  size={14} /> Follow</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Posts section ── */}
      <div className="explore-posts-section">
        <h2 className="explore-posts-heading">Recent Posts</h2>
        {posts.length === 0 && !isLoading ? (
          <p className="explore-empty">No posts to explore yet.</p>
        ) : (
          <div className="explore-posts-list">
            {posts.map((post, index) => {
              const isLast = posts.length === index + 1;
              return (
                <div
                  key={post.id}
                  className="feed-post-card"
                  ref={isLast ? lastPostElementRef : null}
                >
                  <div className="post-header">
                    <Link
                      to={`/profile/${post.user.username}#post-${post.id}`}
                      className="post-header-link"
                    >
                      <img
                        src={post.user.profilePictureUrl || DEFAULT_AVATAR}
                        className="post-avatar-img"
                        alt=""
                      />
                      <div className="post-header-info">
                        <span className="post-username">
                          {post.user.firstName} {post.user.lastName}
                        </span>
                        <span className="post-handle">@{post.user.username}</span>
                      </div>
                    </Link>
                    <span className="post-time">{timeAgo(post.createdAt)}</span>
                  </div>

                  {post.textContent && (
                    <p
                      className="post-body post-media-clickable"
                      onClick={() => setActivePost(post)}
                    >
                      {post.textContent}
                    </p>
                  )}
                  {post.mediaUrl && post.mediaType === "image" && (
                    <img
                      src={post.mediaUrl}
                      className="post-media post-media-clickable"
                      alt=""
                      onClick={() => setActivePost(post)}
                    />
                  )}
                  {post.mediaUrl && post.mediaType === "video" && (
                    <VideoPlayer src={post.mediaUrl} className="post-media" />
                  )}

                  <div className="post-actions">
                    <button
                      className={`post-action-btn${post.isLiked ? " liked" : ""}`}
                      onClick={() => handleLike(post.id)}
                    >
                      {post.isLiked ? <FaHeart /> : <FiHeart />} <span>{post.likeCount}</span>
                    </button>
                    <button
                      className="post-action-btn"
                      onClick={() => setActivePost(post)}
                    >
                      <FiMessageCircle /> <span>{post.commentCount}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {isLoading && <Loader />}
          </div>
        )}
      </div>

      <PostModal
        post={activePost}
        currentUserId={user?.id}
        onClose={() => setActivePost(null)}
        onUpdate={handlePostUpdate}
      />
    </div>
  );
}
