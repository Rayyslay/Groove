import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { FiHeart, FiMessageCircle, FiUserPlus, FiUserCheck, FiMoreHorizontal, FiShare2, FiTrash2 } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Loader from "../../components/Loader";
import VideoPlayer from "../../components/VideoPlayer";
import PostModal from "../../components/PostModal";
import { useToast } from "../../context/ToastContext";
import { API, DEFAULT_AVATAR } from "../../config";
import "./Profile.css";

function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon">
          <FiTrash2 size={28} />
        </div>
        <h3>Delete Post?</h3>
        <p>This action cannot be undone.</p>
        <div className="delete-modal-actions">
          <button className="delete-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="delete-modal-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user: me } = useAuth();
  const { username } = useParams();
  const token = localStorage.getItem("token");
  const { addToast } = useToast();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [deleteModalPostId, setDeleteModalPostId] = useState(null);
  const [activePost, setActivePost] = useState(null);

  // Remember which hash we've already auto-opened so likes/comments updating
  // `profile` don't reopen the modal after the user has closed it.
  const handledHashRef = useRef(null);

  const isOwn = !username || (me && username.toLowerCase() === me.username.toLowerCase());

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const endpoint = isOwn
          ? `${API}/api/users/me`
          : `${API}/api/users/${username}`;
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
  }, [username, isOwn, me, token]);

  // When the URL carries a #post-<id> hash (e.g. from a shared link), scroll
  // to the post AND open it in the PostModal. The ref guard prevents the
  // modal from reopening when `profile` changes for unrelated reasons (like
  // toggle, comment add, post delete) after the user closes the modal.
  useEffect(() => {
    if (loading || !profile || !location.hash) return;
    if (handledHashRef.current === location.hash) return;

    const match = location.hash.match(/^#post-(\d+)$/);
    if (!match) return;

    const postId = parseInt(match[1], 10);
    const post = profile.posts?.find((p) => p.id === postId);
    if (!post) return;

    handledHashRef.current = location.hash;

    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 300);

    setActivePost({
      ...post,
      user: {
        id: profile.id,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePictureUrl: profile.profilePictureUrl,
      },
    });
  }, [loading, profile, location.hash]);

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

  const handleDeletePost = async () => {
    if (!deleteModalPostId) return;
    try {
      await axios.delete(`${API}/api/posts/${deleteModalPostId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile((p) => ({
        ...p,
        postCount: p.postCount - 1,
        posts: p.posts.filter((post) => post.id !== deleteModalPostId),
      }));
      // If the deleted post is currently open in the modal, close it
      setActivePost((prev) => (prev?.id === deleteModalPostId ? null : prev));
      addToast("Post deleted successfully", "success");
    } catch {
      addToast("Failed to delete post", "error");
    }
    setDeleteModalPostId(null);
  };

  const handlePostUpdate = (updated) => {
    setProfile((p) =>
      p ? { ...p, posts: p.posts.map((post) => (post.id === updated.id ? { ...post, ...updated } : post)) } : p
    );
    setActivePost(updated);
  };

  // Profile posts don't carry the embedded user object — the post modal needs it for the header.
  // Attach the profile owner's user info before opening.
  const openPost = (post) => {
    if (!profile) return;
    setActivePost({
      ...post,
      user: {
        id: profile.id,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePictureUrl: profile.profilePictureUrl,
      },
    });
  };

  const handleSharePost = (postId) => {
    const url = `${window.location.origin}/profile/${profile.username}#post-${postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => addToast("Post link copied to clipboard!", "success"))
      .catch(() => addToast("Failed to copy link", "error"));
  };

  if (loading) return <div className="profile-page"><Loader /></div>;
  if (!profile) return <div className="profile-page"><p className="profile-loading">User not found.</p></div>;

  return (
    <div className="profile-page">

      {/* Delete confirmation modal */}
      {deleteModalPostId && (
        <DeleteConfirmModal
          onConfirm={handleDeletePost}
          onCancel={() => setDeleteModalPostId(null)}
        />
      )}

      {/* Transparent backdrop to close dropdown on outside click */}
      {openMenuPostId && (
        <div className="dropdown-backdrop" onClick={() => setOpenMenuPostId(null)} />
      )}

      <div className="profile-layout">

        {/* ── Left column — user info ── */}
        <div className="profile-left">
          <div className="profile-header">
            <div className="profile-avatar">
              <img src={profile.profilePictureUrl || DEFAULT_AVATAR} alt="" />
            </div>
            <div className="profile-info">
              <h1 className="profile-name">
                {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username}
              </h1>
              <p className="profile-handle">@{profile.username}</p>
              <p className="profile-bio">{profile.bio || "No bio yet."}</p>
              {!isOwn && me && (
                <button
                  className={`profile-follow-btn${profile.isFollowing ? " following" : ""}`}
                  onClick={toggleFollow}
                >
                  {profile.isFollowing
                    ? <><FiUserCheck size={16} /> Following</>
                    : <><FiUserPlus size={16} /> Follow</>}
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
        </div>

        {/* ── Right column — posts ── */}
        <div className="profile-right">
          <div className="profile-posts-section">
            <h2>Posts</h2>

            {(!profile.posts || profile.posts.length === 0) ? (
              <p className="profile-empty">
                {isOwn ? "No posts yet. Share your first vibe!" : "No posts yet."}
              </p>
            ) : (
              <div className="profile-posts-grid">
                {profile.posts.map((post) => (
                  <div key={post.id} id={`post-${post.id}`} className={`profile-post-card${openMenuPostId === post.id ? " menu-open" : ""}`}>

                    {/* ── 3-dots menu (owner only) ── */}
                    {isOwn && (
                      <>
                        <button
                          className={`profile-post-menu-btn${openMenuPostId === post.id ? " open" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuPostId(openMenuPostId === post.id ? null : post.id);
                          }}
                          title="Post options"
                        >
                          <FiMoreHorizontal />
                        </button>

                        {openMenuPostId === post.id && (
                          <div className="profile-post-dropdown">
                            <button
                              className="profile-post-dropdown-item"
                              onClick={() => {
                                setDeleteModalPostId(post.id);
                                setOpenMenuPostId(null);
                              }}
                            >
                              <FiTrash2 size={14} />
                              Delete Post
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Media (clickable to open modal) ── */}
                    {post.mediaUrl && post.mediaType === "image" && (
                      <div
                        className="profile-post-media-wrapper post-media-clickable"
                        onClick={() => openPost(post)}
                      >
                        <img src={post.mediaUrl} alt="" className="profile-post-media" />
                      </div>
                    )}
                    {post.mediaUrl && post.mediaType === "video" && (
                      <div className="profile-post-media-wrapper">
                        <VideoPlayer src={post.mediaUrl} fill className="profile-post-media" />
                      </div>
                    )}

                    {/* ── Text (clickable for text-only posts) ── */}
                    {post.textContent && (
                      <p
                        className="profile-post-text post-media-clickable"
                        onClick={() => openPost(post)}
                      >
                        {post.textContent}
                      </p>
                    )}

                    {/* ── Meta bar ── */}
                    <div className="profile-post-meta">
                      <div className="profile-meta-left">
                        <span>{post.isLiked ? <FaHeart size={13} /> : <FiHeart size={13} />} {post.likeCount ?? 0}</span>
                        <button
                          className="profile-post-comments-btn"
                          onClick={() => openPost(post)}
                          title="View post and comments"
                        >
                          <FiMessageCircle size={13} /> {post.commentCount ?? 0}
                        </button>
                      </div>
                      <button
                        className="profile-post-share-btn"
                        onClick={() => handleSharePost(post.id)}
                        title="Copy link to post"
                      >
                        <FiShare2 size={13} />
                        <span>Share</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <PostModal
        post={activePost}
        currentUserId={me?.id}
        onClose={() => setActivePost(null)}
        onUpdate={handlePostUpdate}
        onDelete={(postId) => setDeleteModalPostId(postId)}
      />
    </div>
  );
}
