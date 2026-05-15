import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FiHeart, FiMessageCircle } from "react-icons/fi";
import Loader from "../../components/Loader";
import VideoPlayer from "../../components/VideoPlayer";
import "./Feed.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5290";
const DEFAULT_AVATAR = "/src/assets/Images/profilePictures/default-avatar.jpg";

export default function Feed() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
          const next = prevPage + 1;
          fetchFeed(next);
          return next;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchFeed = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/posts/feed?page=${p}&size=20`, { headers });
      if (p === 1) setPosts(res.data.posts);
      else setPosts((prev) => [...prev, ...res.data.posts]);
      setHasMore(res.data.hasMore);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchFeed(1); }, []);

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
    } catch { /* empty */ }
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
    } catch { /* empty */ }
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
    } catch { /* empty */ }
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading && posts.length === 0) {
    return (
      <div className="feed-page">
        <Loader />
      </div>
    );
  }

  return (
    <div className="feed-page">
      <h1 className="feed-heading">Your Feed</h1>

      {posts.length === 0 ? (
        <div className="feed-empty">
          <p>Your feed is empty.</p>
          <p className="feed-empty-hint">Follow people to see their posts here!</p>
        </div>
      ) : (
        <div className="feed-posts">
          {posts.map((post, index) => {
            const isLast = posts.length === index + 1;
            return (
            <div 
              key={post.id} 
              className="feed-post-card"
              ref={isLast ? lastPostElementRef : null}
            >
              {/* Post Header */}
              <div className="post-header">
                {post.user.profilePictureUrl ? (
                  <img src={post.user.profilePictureUrl} className="post-avatar-img" alt="" />
                ) : (
                  <img src={DEFAULT_AVATAR} className="post-avatar-img" alt="" />
                )}
                <div className="post-header-info">
                  <span className="post-username">
                    {post.user.firstName} {post.user.lastName}
                  </span>
                  <span className="post-handle">@{post.user.username}</span>
                </div>
                <span className="post-time">{timeAgo(post.createdAt)}</span>
              </div>

              {/* Post Body */}
              {post.textContent && <p className="post-body">{post.textContent}</p>}
              {post.mediaUrl && post.mediaType === "image" && (
                <img src={post.mediaUrl} className="post-media" alt="" />
              )}
              {post.mediaUrl && post.mediaType === "video" && (
                <VideoPlayer src={post.mediaUrl} className="post-media" />
              )}

              {/* Actions */}
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

              {/* Comments Section */}
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
                      {c.user.profilePictureUrl ? (
                        <img src={c.user.profilePictureUrl} alt="" className="comment-avatar" />
                      ) : (
                        <img src={DEFAULT_AVATAR} alt="" className="comment-avatar" />
                      )}
                      <span className="comment-username">{c.user.username}</span>
                      <span className="comment-text">{c.content}</span>
                      <span className="comment-time">{timeAgo(c.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          })}

          {loading && <Loader />}
        </div>
      )}
    </div>
  );
}
