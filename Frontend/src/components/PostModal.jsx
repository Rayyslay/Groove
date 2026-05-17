import { useState, useEffect } from "react";
import axios from "axios";
import { FiHeart, FiMessageCircle, FiX, FiTrash2, FiShare2 } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";
import { useToast } from "../context/ToastContext";
import "./PostModal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5290";
const DEFAULT_AVATAR = "/assets/profilePictures/default-avatar.jpg";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostModal({ post, currentUserId, onClose, onUpdate, onDelete }) {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const { addToast } = useToast();

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const handleShare = () => {
    if (!post?.user?.username) return;
    const url = `${window.location.origin}/profile/${post.user.username}#post-${post.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => addToast("Post link copied to clipboard!", "success"))
      .catch(() => addToast("Failed to copy link", "error"));
  };

  // Fetch comments when post changes
  useEffect(() => {
    if (!post) return;
    setLoadingComments(true);
    axios
      .get(`${API}/api/posts/${post.id}/comments`, { headers })
      .then((res) => setComments(res.data))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  // Esc to close
  useEffect(() => {
    if (!post) return;
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [post, onClose]);

  if (!post) return null;

  const handleLike = async () => {
    try {
      const res = await axios.post(`${API}/api/posts/${post.id}/like`, null, { headers });
      onUpdate?.({ ...post, isLiked: res.data.liked, likeCount: res.data.likeCount });
    } catch { /* ignore */ }
  };

  const handleSubmitComment = async () => {
    const content = commentInput.trim();
    if (!content) return;
    try {
      const res = await axios.post(
        `${API}/api/posts/${post.id}/comments`,
        { content },
        { headers }
      );
      setComments((prev) => [res.data, ...prev]);
      setCommentInput("");
      onUpdate?.({ ...post, commentCount: (post.commentCount ?? 0) + 1 });
    } catch { /* ignore */ }
  };

  const hasMedia = !!post.mediaUrl;
  const isOwner = currentUserId != null && currentUserId === post.user?.id;

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div
        className={`post-modal${hasMedia ? "" : " post-modal-text-only"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="post-modal-close" onClick={onClose} aria-label="Close">
          <FiX size={20} />
        </button>

        {hasMedia && (
          <div className="post-modal-media-pane">
            {post.mediaType === "image" && (
              <img src={post.mediaUrl} alt="" className="post-modal-media" />
            )}
            {post.mediaType === "video" && (
              <VideoPlayer src={post.mediaUrl} className="post-modal-media" />
            )}
          </div>
        )}

        <div className="post-modal-side">
          {/* Header */}
          <div className="post-modal-header">
            <Link
              to={`/profile/${post.user?.username}`}
              className="post-modal-header-link"
              onClick={onClose}
            >
              <img
                src={post.user?.profilePictureUrl || DEFAULT_AVATAR}
                alt=""
                className="post-modal-avatar"
              />
              <div className="post-modal-header-info">
                <span className="post-modal-name">
                  {post.user?.firstName} {post.user?.lastName}
                </span>
                <span className="post-modal-handle">@{post.user?.username}</span>
              </div>
            </Link>
            <span className="post-modal-time">{timeAgo(post.createdAt)}</span>
          </div>

          {/* Body text */}
          {post.textContent && (
            <p className="post-modal-body">{post.textContent}</p>
          )}

          {/* Actions */}
          <div className="post-modal-actions">
            <button
              className={`post-modal-action${post.isLiked ? " liked" : ""}`}
              onClick={handleLike}
            >
              {post.isLiked ? <FaHeart /> : <FiHeart />}
              <span>{post.likeCount ?? 0}</span>
            </button>
            <span className="post-modal-action post-modal-action-readonly">
              <FiMessageCircle />
              <span>{post.commentCount ?? 0}</span>
            </span>
            <div className="post-modal-actions-right">
              <button
                className="post-modal-share-btn"
                onClick={handleShare}
                title="Copy link to post"
              >
                <FiShare2 />
              </button>
              {isOwner && onDelete && (
                <button
                  className="post-modal-delete-btn"
                  onClick={() => onDelete(post.id)}
                  title="Delete post"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          </div>

          {/* Comment list */}
          <div className="post-modal-comments">
            {loadingComments ? (
              <p className="post-modal-comments-msg">Loading comments…</p>
            ) : comments.length === 0 ? (
              <p className="post-modal-comments-msg">No comments yet. Be the first.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="post-modal-comment">
                  <img
                    src={c.user.profilePictureUrl || DEFAULT_AVATAR}
                    alt=""
                    className="post-modal-comment-avatar"
                  />
                  <div className="post-modal-comment-body">
                    <span className="post-modal-comment-user">@{c.user.username}</span>
                    <span className="post-modal-comment-text">{c.content}</span>
                    <span className="post-modal-comment-time">{timeAgo(c.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input (pinned to bottom) */}
          <div className="post-modal-comment-input-row">
            <input
              className="post-modal-comment-input"
              placeholder="Write a comment…"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            />
            <button
              className="post-modal-comment-send"
              onClick={handleSubmitComment}
              disabled={!commentInput.trim()}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
