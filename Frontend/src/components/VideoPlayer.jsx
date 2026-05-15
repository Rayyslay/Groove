import { useRef, useState } from "react";
import { FiPlay, FiPause, FiVolume2, FiVolumeX } from "react-icons/fi";
import "./VideoPlayer.css";

function fmt(secs) {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ src, className = "", fill = false }) {
  const videoRef = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [muted, setMuted]         = useState(true);
  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [current, setCurrent]     = useState(0);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play();  setPlaying(true);  }
    else          { v.pause(); setPlaying(false); }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v?.duration) return;
    setCurrent(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleLoaded = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    setCurrent(0);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  return (
    <div
      className={[
        "vp-wrapper",
        fill        ? "vp-fill"   : "",
        !playing    ? "vp-paused" : "",
        className,
      ].join(" ").trim()}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        className="vp-video"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoaded}
        onEnded={handleEnded}
      />

      {/* ── Centre play / pause indicator ── */}
      <div className="vp-center">
        <div className="vp-center-icon">
          {playing
            ? <FiPause size={22} />
            : <FiPlay  size={22} style={{ marginLeft: 3 }} />}
        </div>
      </div>

      {/* ── Bottom controls bar ── */}
      <div className="vp-controls" onClick={(e) => e.stopPropagation()}>
        <div className="vp-progress" onClick={handleSeek}>
          <div className="vp-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="vp-bottom">
          <button className="vp-btn" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
            {muted ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
          </button>
          {duration > 0 && (
            <span className="vp-time">{fmt(current)} / {fmt(duration)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
