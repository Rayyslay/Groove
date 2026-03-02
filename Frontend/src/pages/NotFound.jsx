import { Link } from "react-router-dom";
import { useScrollReveal } from "../hooks/useScrollReveal";
// No separate CSS import — all styles live in index.css

export default function NotFound() {
  const content = useScrollReveal({ threshold: 0.1 });

  return (
    <div className="notfound-container">
      <div ref={content} className="notfound-content reveal">
        <h1 className="notfound-code">404</h1>
        <h2 className="notfound-title">Page Not Found</h2>
        <p className="notfound-subtitle">
          Looks like this page lost its groove. The link you followed doesn't exist.
        </p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}