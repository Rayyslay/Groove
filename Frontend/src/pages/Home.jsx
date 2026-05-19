import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Home.css";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { API } from "../config";

export default function Home() {
  // ── Hero section (page-load: elements are already in view, low threshold)
  const heroTitle    = useScrollReveal({ threshold: 0.1 });
  const heroSubtitle = useScrollReveal({ threshold: 0.1 });
  const heroDisc     = useScrollReveal({ threshold: 0.1 });

  // ── Difference section
  const diffTitle    = useScrollReveal({ threshold: 0.2 });
  const diffImage    = useScrollReveal({ threshold: 0.2 });
  const timelineItem0 = useScrollReveal({ threshold: 0.2 });
  const timelineItem1 = useScrollReveal({ threshold: 0.2 });
  const timelineItem2 = useScrollReveal({ threshold: 0.2 });
  const timelineItem3 = useScrollReveal({ threshold: 0.2 });

  // ── Join CTA (bottom): fade-up reveal + ease-out counter to live user count
  const ctaRef = useRef(null);
  const [targetCount, setTargetCount] = useState(null);
  const [displayCount, setDisplayCount] = useState(0);
  const [ctaVisible, setCtaVisible] = useState(false);

  // Fetch the live user count once on mount (server-cached).
  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/api/users/count`)
      .then((res) => {
        if (!cancelled) setTargetCount(res.data?.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setTargetCount(0);
      });
    return () => { cancelled = true; };
  }, []);

  // Reveal the section when it scrolls into view.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCtaVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ease-out cubic counter from 0 → targetCount once the section is visible.
  useEffect(() => {
    if (!ctaVisible || targetCount == null) return;
    if (targetCount <= 0) { setDisplayCount(0); return; }

    const duration = 2000; // ms
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplayCount(Math.round(targetCount * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ctaVisible, targetCount]);

  return (
    <div className="page-wrapper">

      {/* Animated Gradient Background */}
      <div className="gradient-bg" />

      {/* ── HERO SECTION ── */}
      <section className="home-container">

        <div className="home-content">
          <h1
            ref={heroTitle}
            className="home-title reveal"
            style={{ "--delay": "0.1s" }}
          >
            Find Your <span>Groove</span>
          </h1>

          <p
            ref={heroSubtitle}
            className="home-subtitle reveal"
            style={{ "--delay": "0.3s" }}
          >
            Join the Groove Fest and share your vibe with the world.
            Express yourself, connect with others, and be unapologetically you.
            <img src="/assets/smileyFace.png" className="emoji" />
          </p>
        </div>

        <div
          ref={heroDisc}
          className="home-right-side reveal-right"
          style={{ "--delay": "0.5s" }}
        >
          <img src="/assets/musicDisc.webp" alt="Home" className="disc-image" />
        </div>

      </section>

      {/* ── WHAT MAKES US DIFFERENT ── */}
      <section className="difference-section">

        <h2
          ref={diffTitle}
          className="difference-title reveal"
          style={{ "--delay": "0s" }}
        >
          What Makes Us Different
        </h2>

        <div
          ref={diffImage}
          className="difference-left-side reveal-left"
          style={{ "--delay": "0.15s" }}
        >
          <img src="/assets/GR-expand.webp" alt="Logo" className="difference-image" />
        </div>

        <div>
          <div className="timeline">

            <div
              ref={timelineItem0}
              className="timeline-item reveal"
              style={{ "--delay": "0.1s" }}
            >
              <div className="timeline-point"></div>
              <div className="timeline-content">
                <h3>Express Freely</h3>
                <p>Share your vibe and be unapologetically yourself without limits.</p>
              </div>
            </div>

            <div
              ref={timelineItem1}
              className="timeline-item reveal"
              style={{ "--delay": "0.25s" }}
            >
              <div className="timeline-point"></div>
              <div className="timeline-content">
                <h3>Connect Instantly</h3>
                <p>Meet like-minded people and build your own social circle.</p>
              </div>
            </div>

            <div
              ref={timelineItem2}
              className="timeline-item reveal"
              style={{ "--delay": "0.4s" }}
            >
              <div className="timeline-point"></div>
              <div className="timeline-content">
                <h3>Discover Communities</h3>
                <p>Join groups and spaces where your groove fits.</p>
              </div>
            </div>

            <div
              ref={timelineItem3}
              className="timeline-item reveal"
              style={{ "--delay": "0.55s" }}
            >
              <div className="timeline-point"></div>
              <div className="timeline-content">
                <h3>Stay Inspired</h3>
                <p>Get inspired by trends and creative content across the platform.</p>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ── JOIN CTA (bottom) ── */}
      <section
        ref={ctaRef}
        className={`join-cta ${ctaVisible ? "join-cta--visible" : ""}`}
      >
        <h2 className="join-cta-title">
          Are you ready to join{" "}
          <span className="join-cta-count">
            {displayCount.toLocaleString()}
          </span>{" "}
          users?
        </h2>
      </section>
    </div>
  );
}
