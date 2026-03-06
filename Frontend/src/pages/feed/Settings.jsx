import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axios from "axios";
import { FiCamera } from "react-icons/fi";
import "./Settings.css";

const API = "http://localhost:5290";

export default function Settings() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const token = localStorage.getItem("token");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [pfpPreview, setPfpPreview] = useState(null);
  const [pfpFile, setPfpFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setPfpPreview(user.profilePictureUrl || null);
    }
  }, [user]);

  const handlePfpChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast("Image must be 5 MB or less.", "error");
      return;
    }
    setPfpFile(file);
    setPfpPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("username", username.trim());
      formData.append("bio", bio.trim());
      if (pfpFile) formData.append("profilePicture", pfpFile);

      const res = await axios.put(`${API}/api/users/me`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setUser((prev) => ({ ...prev, ...res.data }));
      setPfpFile(null);
      addToast("Profile updated!", "success");
    } catch (err) {
      const msg = err.response?.data || "Failed to update profile.";
      addToast(typeof msg === "string" ? msg : "Failed to update profile.", "error");
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="settings-page">
      <h1 className="settings-heading">Settings</h1>

      <form className="settings-form" onSubmit={handleSave}>
        {/* Profile picture */}
        <div className="settings-pfp-section">
          <div className="settings-pfp-wrapper">
            <div className="settings-pfp">
              {pfpPreview ? (
                <img src={pfpPreview.startsWith("blob:") ? pfpPreview : `${API}${pfpPreview}`} alt="" />
              ) : (
                <span>{(username || "?")[0].toUpperCase()}</span>
              )}
            </div>
            <label className="settings-pfp-overlay">
              <FiCamera size={20} />
              <input type="file" accept="image/*" onChange={handlePfpChange} hidden />
            </label>
          </div>
          <p className="settings-pfp-hint">Click to change profile picture</p>
        </div>

        {/* Account details */}
        <div className="settings-section">
          <h2>Account Details</h2>

          <div className="settings-field">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="settings-input"
            />
          </div>

          <div className="settings-field">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="settings-input"
            />
          </div>

          <div className="settings-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="settings-input"
            />
          </div>

          <div className="settings-field">
            <label>Email</label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="settings-input disabled"
            />
            <span className="settings-field-hint">Email cannot be changed.</span>
          </div>

          <div className="settings-field">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="settings-textarea"
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <button type="submit" className="settings-save-btn" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
