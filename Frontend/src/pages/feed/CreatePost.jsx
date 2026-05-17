import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import axios from "axios";
import "./CreatePost.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5290";
const MAX_TEXT = 256;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function CreatePost() {
  const [postType, setPostType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const token = localStorage.getItem("token");

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      const sizeMB = (f.size / 1024 / 1024).toFixed(1);
      addToast(`File is ${sizeMB} MB — maximum is 10 MB. Please pick a smaller file.`, "error");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (postType === "text" && !textContent.trim()) {
      addToast("Write something before posting!", "error");
      return;
    }
    if (postType === "media" && !file) {
      addToast("Select a photo or video to post.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("postType", postType);
      if (textContent.trim()) formData.append("textContent", textContent.trim());
      if (file) formData.append("media", file);

      await axios.post(`${API}/api/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      addToast("Post created!", "success");
      navigate("/feed");
    } catch (err) {
      console.error("Post upload failed:", err.response?.data || err.message);
      const msg = err.response?.data?.message || err.response?.data?.details || "Failed to create post.";
      addToast(msg, "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="create-post-page">
      <h1 className="create-post-heading">Create Post</h1>

      <div className="post-type-tabs">
        <button
          className={`tab-btn${postType === "text" ? " active" : ""}`}
          onClick={() => { setPostType("text"); setFile(null); setPreview(null); }}
        >
          Text
        </button>
        <button
          className={`tab-btn${postType === "media" ? " active" : ""}`}
          onClick={() => setPostType("media")}
        >
          Photo / Video
        </button>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="textarea-wrapper">
          <textarea
            className="post-textarea"
            placeholder={postType === "text" ? "What's on your mind?" : "Add a caption..."}
            maxLength={MAX_TEXT}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
          <span className="char-count">
            {textContent.length}/{MAX_TEXT}
          </span>
        </div>

        {postType === "media" && (
          <div className="media-upload">
            <label className="upload-label">
              {file ? "Change file" : "Choose photo or video"}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                hidden
              />
            </label>
            {file && <span className="file-name">{file.name}</span>}
            {preview && file?.type.startsWith("image") && (
              <div className="media-preview-container">
                <img src={preview} className="media-preview" alt="" />
              </div>
            )}
            {preview && file?.type.startsWith("video") && (
              <div className="media-preview-container">
                <video src={preview} className="media-preview" controls controlsList="nodownload" playsInline />
              </div>
            )}
          </div>
        )}

        <button type="submit" className="submit-post-btn" disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
