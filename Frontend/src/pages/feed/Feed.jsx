import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { FiHeart, FiMessageCircle } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Loader from "../../components/Loader";
import VideoPlayer from "../../components/VideoPlayer";
import PostModal from "../../components/PostModal";
import { API, DEFAULT_AVATAR } from "../../config";
import "./Feed.css";

export default function Feed() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState(null);

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
      setActivePost((prev) =>
        prev?.id === postId
          ? { ...prev, isLiked: res.data.liked, likeCount: res.data.likeCount }
          : prev
      );
    } catch { /* empty */ }
  };

  const handlePostUpdate = (updated) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setActivePost(updated);
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

              {/* Actions */}
              <div className="post-actions">
                <button
                  className={`post-action-btn${post.isLiked ? " liked" : ""}`}
                  onClick={() => handleLike(post.id)}
                >
                  {post.isLiked ? <FaHeart /> : <FiHeart />}
                  <span>{post.likeCount}</span>
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

          {loading && <Loader />}
        </div>
      )}

      <PostModal
        post={activePost}
        currentUserId={user?.id}
        onClose={() => setActivePost(null)}
        onUpdate={handlePostUpdate}
      />
    </div>
  );
}
