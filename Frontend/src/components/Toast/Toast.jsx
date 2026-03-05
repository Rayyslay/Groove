import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import "./Toast.css";

export default function Toast({ id, message, type }) {
  const { removeToast } = useToast();
  const duration = 4000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = 30;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => prev - step);
    }, interval);

    const timeout = setTimeout(() => {
      removeToast(id);
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [id, removeToast]);

  return (
    <div className="toast">

      <div className="toast-body">
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={() => removeToast(id)}>×</button>
      </div>

      <div
        className={`toast-progress-bar toast-progress-${type}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}