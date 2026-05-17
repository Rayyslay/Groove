import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaVenusMars, FaPen } from "react-icons/fa";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../utils/cropImage";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./SetupProfile.css";
import "./auth.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5290";
const DEFAULT_AVATAR = "/assets/profilePictures/default-avatar.jpg";

export default function SetupProfile() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const token = localStorage.getItem("token");
  /* -------------------- FORM STATE -------------------- */
  const [formData, setFormData] = useState({
    profileImage: null,
    dateOfBirth: "",
    gender: "",
    bio: "",
  });

  /* -------------------- CROP STATE -------------------- */
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  /* -------------------- UI STATE -------------------- */
  const [showProfileOptions, setShowProfileOptions] = useState(false);

  const fileInputRef = useRef(null);
  const profileRef = useRef(null);
  const dateInputRef = useRef(null);

  /* -------------------- CLOSE PROFILE MENU ON OUTSIDE CLICK -------------------- */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* -------------------- GENERIC INPUT HANDLER -------------------- */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedArea(null);
        setShowCropModal(true);
      };
      reader.readAsDataURL(files[0]);
      e.target.value = "";
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* -------------------- CROP LOGIC -------------------- */
  const onCropComplete = (area, areaPixels) => {
    setCroppedArea(area);
    setCroppedAreaPixels(areaPixels);
  };

  const handleCropConfirm = async () => {
    const croppedBlob = await getCroppedImg(
      imageSrc,
      crop,
      zoom,
      croppedAreaPixels
    );

    setFormData((prev) => ({
      ...prev,
      profileImage: croppedBlob,
    }));

    setShowCropModal(false);
  };

  /* -------------------- PROFILE IMAGE OPTIONS -------------------- */
  const handleUploadClick = () => {
    fileInputRef.current.click();
    setShowProfileOptions(false);
  };

  const handleResetClick = () => {
    setFormData((prev) => ({ ...prev, profileImage: null }));
    setShowProfileOptions(false);
  };

  /* -------------------- SUBMIT -------------------- */
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fd = new FormData();
      if (formData.bio.trim()) fd.append("bio", formData.bio.trim());
      if (formData.gender) fd.append("gender", formData.gender);
      if (formData.dateOfBirth) fd.append("dateOfBirth", formData.dateOfBirth);
      if (formData.profileImage) fd.append("profilePicture", formData.profileImage, "avatar.jpg");

      await axios.put(`${API}/api/users/me`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      addToast("Profile setup complete!", "success");
      navigate("/feed");
    } catch (err) {
      const msg = err.response?.data || "Failed to save profile.";
      addToast(typeof msg === "string" ? msg : "Failed to save profile.", "error");
    }
    setSaving(false);
  };

  /* -------------------- RENDER -------------------- */
  return (
    <div className="auth-page">
      <div className="glass-card">
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Complete Your Profile
        </h2>

        <form onSubmit={handleSubmit}>

          {/* PROFILE IMAGE */}
          <div
            ref={profileRef}
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              marginBottom: "30px"
            }}
          >
            <img
              src={
                formData.profileImage
                  ? URL.createObjectURL(formData.profileImage)
                  : DEFAULT_AVATAR
              }
              alt="Profile"
              style={{
                width: "130px",
                height: "130px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--border-subtle)"
              }}
            />

            {/* PEN BUTTON */}
            <div
              onClick={() => setShowProfileOptions((prev) => !prev)}
              style={{
                position: "absolute",
                bottom: "8px",
                right: "calc(50% - 65px)",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "var(--purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "3px solid var(--bg-elevated)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                transition: "0.2s ease"
              }}
            >
              <FaPen size={16} color="#ffffff" />
            </div>

            {/* PROFILE MENU */}
            {showProfileOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "100%",
                  transform: "translateY(-50%)",
                  marginLeft: "15px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "14px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                  minWidth: "180px",
                  zIndex: 100
                }}
              >
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
              name="profileImage"
              onChange={handleChange}
              style={{ display: "none" }}
            />
          </div>

          {/* DATE OF BIRTH */}
          <div className="input-group">
            <FaCalendarAlt
              style={{
                position: "absolute",
                right: "14px",
                top: "14px",
                color: "var(--text-muted)",
                cursor: "pointer",
                zIndex: 2
              }}
              onClick={() => dateInputRef.current?.showPicker?.()}
            />
            <input
              ref={dateInputRef}
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="input"
              placeholder=" "
            />
            <label className="user-label">Date of Birth</label>
          </div>

          {/* GENDER */}
          <div className="input-group">
            <FaVenusMars
              style={{
                position: "absolute",
                right: "14px",
                top: "14px",
                color: "var(--text-muted)"
              }}
            />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input"
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)"
              }}
            >
              <option value="" disabled hidden>Select gender (optional)</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="PreferNotToSay">Prefer not to say</option>
            </select>
            <label className="user-label">Gender</label>
          </div>

          {/* BIO */}
          <div className="input-group">
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="input"
              placeholder=" "
              maxLength="150"
            />
            <label className="user-label">Bio</label>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Finish Setup"}
          </button>
        </form>

        {/* CROP MODAL */}
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
                    {croppedArea && (
                      <img
                        src={imageSrc}
                        alt="Preview"
                        style={{
                          width: `${(100 / croppedArea.width) * 100}%`,
                          height: `${(100 / croppedArea.height) * 100}%`,
                          left: `${-(croppedArea.x / croppedArea.width) * 100}%`,
                          top: `${-(croppedArea.y / croppedArea.height) * 100}%`,
                        }}
                      />
                    )}
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
    </div>
  );
}