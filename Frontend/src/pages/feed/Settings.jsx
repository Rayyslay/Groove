import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axios from "axios";
import { FaCalendarAlt, FaPen } from "react-icons/fa";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../utils/cropImage";
import "./Settings.css";
import "../authorization/SetupProfile.css";

const API = "http://localhost:5290";
const DEFAULT_AVATAR = "/src/assets/Images/profilePictures/default-avatar.jpg";

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const { addToast } = useToast();
  const token = localStorage.getItem("token");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [pfpPreview, setPfpPreview] = useState(null);
  const [pfpFile, setPfpFile] = useState(null);
  const [saving, setSaving] = useState(false);

  /* Crop state */
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showProfileOptions, setShowProfileOptions] = useState(false);

  const dateInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileRef = useRef(null);

  /* Close profile menu on outside click */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setGender(user.gender || "");
      setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "");
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
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
    setShowProfileOptions(false);
  };

  const handleResetClick = () => {
    setPfpFile(null);
    setPfpPreview(null);
    setShowProfileOptions(false);
  };

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    const croppedBlob = await getCroppedImg(imageSrc, crop, zoom, croppedAreaPixels);
    setPfpFile(croppedBlob);
    setPfpPreview(URL.createObjectURL(croppedBlob));
    setShowCropModal(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("bio", bio.trim());
      if (gender) formData.append("gender", gender);
      if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
      if (pfpFile) formData.append("profilePicture", pfpFile, "avatar.jpg");

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
          <div className="settings-pfp-wrapper" ref={profileRef}>
            <div className="settings-pfp">
              {pfpPreview ? (
                <img src={pfpPreview.startsWith("blob:") ? pfpPreview : pfpPreview} alt="" />
              ) : (
                <img src={DEFAULT_AVATAR} alt="" />
              )}
            </div>

            {/* Pen button */}
            <div
              className="settings-pfp-pen"
              onClick={() => setShowProfileOptions((prev) => !prev)}
            >
              <FaPen size={14} color="#ffffff" />
            </div>

            {/* Dropdown menu */}
            {showProfileOptions && (
              <div className="settings-pfp-menu">
                <button type="button" onClick={handleUploadClick}>
                  Upload Image
                </button>
                <button type="button" onClick={handleResetClick}>
                  Reset to Default
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePfpChange}
              style={{ display: "none" }}
            />
          </div>
          <p className="settings-pfp-hint">Click the pen to change profile picture</p>
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
              disabled
              className="settings-input disabled"
            />
            <span className="settings-field-hint">Username cannot be changed.</span>
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
            <label>Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="settings-input"
            >
              <option value="" disabled hidden>Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="PreferNotToSay">Prefer not to say</option>
            </select>
          </div>

          <div className="settings-field">
            <label>Date of Birth</label>
            <div className="settings-date-wrapper">
              <input
                ref={dateInputRef}
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="settings-input"
              />
              <FaCalendarAlt
                className="settings-date-icon"
                onClick={() => dateInputRef.current?.showPicker?.()}
              />
            </div>
          </div>

          <div className="settings-field">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="settings-textarea"
              maxLength={150}
              rows={3}
            />
          </div>
        </div>

        <button type="submit" className="settings-save-btn" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Logout */}
      <div className="settings-logout-section">
        <button
          type="button"
          className="settings-logout-btn"
          onClick={() => { logout(); navigate("/"); }}
        >
          Log Out
        </button>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="crop-overlay">
          <div className="crop-modal">
            <div className="crop-modal-header">
              <h3>Crop Photo</h3>
              <button
                type="button"
                className="crop-modal-close"
                onClick={() => setShowCropModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="crop-modal-body">
              <div className="crop-container">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="crop-sidebar">
                <h4>Preview</h4>
                <div className="preview-circle">
                  <img
                    src={imageSrc}
                    alt="Preview"
                    style={{
                      transform: `translate(-${crop.x}px, -${crop.y}px) scale(${zoom})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
                <div className="crop-zoom">
                  <label>Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={{ "--zoom-pct": `${((zoom - 1) / 2) * 100}%` }}
                  />
                  <span className="zoom-value">{zoom.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            <div className="crop-modal-footer">
              <button
                type="button"
                className="crop-btn crop-btn-cancel"
                onClick={() => setShowCropModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="crop-btn crop-btn-save"
                onClick={handleCropConfirm}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
