import "./Home.css";
import { useScrollReveal } from "../hooks/useScrollReveal";

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
    </div>
  );
}