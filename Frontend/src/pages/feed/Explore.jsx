import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { FiUserPlus, FiUserCheck, FiChevronLeft, FiChevronRight, FiHeart, FiMessageCircle } from "react-icons/fi";
import "./Explore.css";
import "./Feed.css";

const API = "http://localhost:5290";

export default function Explore() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, postsRes] = await Promise.all([
          axios.get(`${API}/api/users/search`, {
            params: { q: "", excludeSelf: true },
            headers,
          }),
          axios.get(`${API}/api/posts/explore?page=1&size=20`, { headers }),
        ]);
        setUsers(usersRes.data);
        setPosts(postsRes.data.posts);
        setHasMore(postsRes.data.hasMore);
      } catch {
        /* ignore */
      }
    };
    fetchData();
  }, [token]);

  const toggleFollow = async (userId) => {
    try {
      const res = await axios.post(
        `${API}/api/users/${userId}/follow`,
        {},
        { headers }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: res.data.following } : u
        )
      );
    } catch {
      /* ignore */
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`${API}/api/posts/${postId}/like`, null, { headers });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: res.data.liked, likeCount: res.data.likeCount }
            : p
        )
      );
    } catch {
      /* ignore */
    }
  };

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => ({ ...prev, [postId]: false }));
      return;
    }
    try {
      const res = await axios.get(`${API}/api/posts/${postId}/comments`, { headers });
      setCommentsData((prev) => ({ ...prev, [postId]: res.data }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    } catch {
      /* ignore */
    }
  };

  const submitComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    try {
      const res = await axios.post(
        `${API}/api/posts/${postId}/comments`,
        { content },
        { headers }
      );
      setCommentsData((prev) => ({
        ...prev,
        [postId]: [res.data, ...(prev[postId] || [])],
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch {
      /* ignore */
    }
  };

  const loadMore = async () => {
    const next = page + 1;
    try {
      const res = await axios.get(`${API}/api/posts/explore?page=${next}&size=20`, { headers });
      setPosts((prev) => [...prev, ...res.data.posts]);
      setHasMore(res.data.hasMore);
      setPage(next);
    } catch {
      /* ignore */
    }
  };

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 260, behavior: "smooth" });
    }
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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
              <button onClick={() => scroll(-1)} className="scroll-btn"><FiChevronLeft size={20} /></button>
              <button onClick={() => scroll(1)} className="scroll-btn"><FiChevronRight size={20} /></button>
            </div>
          </div>
          <div className="explore-accounts-track" ref={scrollRef}>
            {users.map((u) => (
              <div key={u.id} className="explore-card">
                <Link to={`/profile/${u.id}`} className="explore-card-link">
                  <div className="explore-card-avatar">
                    {u.profilePictureUrl ? (
                      <img src={u.profilePictureUrl} alt="" />
                    ) : (
                      <span>{(u.username || "?")[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span className="explore-card-name">{[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username}</span>
                  <span className="explore-card-bio">@{u.username}</span>
                </Link>
                {user && u.id !== user.id && (
                  <button
                    className={`explore-follow-btn${u.isFollowing ? " following" : ""}`}
                    onClick={() => toggleFollow(u.id)}
                  >
                    {u.isFollowing ? <><FiUserCheck size={14} /> Following</> : <><FiUserPlus size={14} /> Follow</>}
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
        {posts.length === 0 ? (
          <p className="explore-empty">No posts to explore yet.</p>
        ) : (
          <div className="explore-posts-list">
            {posts.map((post) => (
              <div key={post.id} className="feed-post-card">
                <div className="post-header">
                  <Link to={`/profile/${post.user.id}`} className="post-header-link">
                    {post.user.profilePictureUrl ? (
                      <img src={`${API}${post.user.profilePictureUrl}`} className="post-avatar-img" alt="" />
                    ) : (
                      <div className="post-avatar" />
                    )}
                    <div className="post-header-info">
                      <span className="post-username">
                        {post.user.firstName} {post.user.lastName}
                      </span>
                      <span className="post-handle">@{post.user.username}</span>
                    </div>
                  </Link>
                  <span className="post-time">{timeAgo(post.createdAt)}</span>
                </div>

                {post.textContent && <p className="post-body">{post.textContent}</p>}
                {post.mediaUrl && post.mediaType === "image" && (
                  <img src={`${API}${post.mediaUrl}`} className="post-media" alt="" />
                )}
                {post.mediaUrl && post.mediaType === "video" && (
                  <video src={`${API}${post.mediaUrl}`} className="post-media" controls />
                )}

                <div className="post-actions">
                  <button
                    className={`post-action-btn${post.isLiked ? " liked" : ""}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <FiHeart /> <span>{post.likeCount}</span>
                  </button>
                  <button className="post-action-btn" onClick={() => toggleComments(post.id)}>
                    <FiMessageCircle /> <span>{post.commentCount}</span>
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <div className="post-comments">
                    <div className="comment-input-row">
                      <input
                        className="comment-input"
                        placeholder="Write a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                      />
                      <button className="comment-send" onClick={() => submitComment(post.id)}>
                        Post
                      </button>
                    </div>
                    {(commentsData[post.id] || []).map((c) => (
                      <div key={c.id} className="comment-item">
                        <span className="comment-username">@{c.user.username}</span>
                        <span className="comment-text">{c.content}</span>
                        <span className="comment-time">{timeAgo(c.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {hasMore && (
              <button className="feed-load-more" onClick={loadMore}>
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
