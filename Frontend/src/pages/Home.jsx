import "./Home.css";

export default function Home() {
  return (
    <div className="page-wrapper">

      {/* Animated Gradient Background */}
      <div className="gradient-bg" />

      {/* HERO SECTION */}
      <section className="home-container">
        <div className="home-content">
          <h1 className="home-title">
            Find Your <span>Groove</span>
          </h1>

          <p className="home-subtitle">
            Join the Groove Fest and share your vibe with the world.
            Express yourself, connect with others, and be unapologetically you.
            <img src="/src/assets/Images/smileyFace.png" className="emoji" />
          </p>
        </div>

        <div className="home-right-side">
          <img src="/src/assets/Images/musicDisc.png" alt="Home" className="disc-image" />
        </div>

      </section>

      {/* WHAT MAKES US DIFFERENT */}
      <section className="difference-section">

        <h2 className="difference-title">What Makes Us Different</h2>

        <div  className="difference-left-side">
          <img src="/src/assets/Images/GR expand.png" alt="Logo" className="difference-image" />
        </div>

        <div>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-point"></div>
              <div className="timeline-content">
                <h3>Express Freely</h3>
                <p>Share your vibe and be unapologetically yourself without limits.</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-point"></div>
              <div className="timeline-content">
                <h3>Connect Instantly</h3>
                <p>Meet like-minded people and build your own social circle.</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-point"></div>
              <div className="timeline-content">
                <h3>Discover Communities</h3>
                <p>Join groups and spaces where your groove fits.</p>
              </div>
            </div>

            <div className="timeline-item">
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