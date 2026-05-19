import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUploadCloud, FiX } from "react-icons/fi";
import { useToast } from "../../context/ToastContext";
import axios from "axios";
import { API } from "../../config";
import "./CreatePost.css";
const MAX_TEXT = 256;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function CreatePost() {
  const [postType, setPostType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const token = localStorage.getItem("token");

  // Revoke any outstanding object URL when the component unmounts or the
  // preview is replaced — prevents leaking blob: URLs for the lifetime of the tab.
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const acceptFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      addToast("Only images and videos can be posted.", "error");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      const sizeMB = (f.size / 1024 / 1024).toFixed(1);
      addToast(`File is ${sizeMB} MB — maximum is 10 MB. Please pick a smaller file.`, "error");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleFileChange = (e) => {
    acceptFile(e.target.files?.[0]);
    // Reset the input so picking the same file twice in a row still fires onChange.
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    // Only clear when leaving the dropzone for real, not when entering a child element.
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
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
          onClick={() => { setPostType("text"); clearFile(); }}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              hidden
            />

            {!file && (
              <button
                type="button"
                className={`dropzone${isDragging ? " dropzone--active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FiUploadCloud className="dropzone-icon" />
                <span className="dropzone-title">
                  {isDragging ? "Drop to upload" : "Drag a photo or video here"}
                </span>
                <span className="dropzone-subtitle">
                  or <span className="dropzone-browse">click to browse</span> · up to 10 MB
                </span>
              </button>
            )}

            {file && (
              <div className="media-preview-container">
                {file.type.startsWith("image") && (
                  <img src={preview} className="media-preview" alt="" />
                )}
                {file.type.startsWith("video") && (
                  <video src={preview} className="media-preview" controls controlsList="nodownload" playsInline />
                )}

                <button
                  type="button"
                  className="media-remove-btn"
                  onClick={clearFile}
                  aria-label="Remove file"
                  title="Remove"
                >
                  <FiX />
                </button>

                <div className="media-meta">
                  <span className="file-name" title={file.name}>{file.name}</span>
                  <button
                    type="button"
                    className="media-change-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change file
                  </button>
                </div>
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
