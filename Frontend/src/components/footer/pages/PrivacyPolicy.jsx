import "./footer-pages.css";

export default function PrivacyPolicy() {
  return (
    <div className="footer-page">
      <h1>Privacy Policy</h1>
      <p className="page-meta">Last updated: March 2026</p>

      <section>
        <p>
          At Groove, your privacy matters. This policy explains what data we collect, how we use
          it, and your rights over it.
        </p>
      </section>

      <section>
        <h2>Information We Collect</h2>
        <ul>
          <li>Account information: name, username, email address, and password (hashed).</li>
          <li>Profile data: bio, profile picture, and any content you voluntarily share.</li>
          <li>Usage data: pages visited, actions taken, and device/browser information.</li>
        </ul>
      </section>

      <section>
        <h2>How We Use Your Data</h2>
        <ul>
          <li>To operate and improve the Groove platform.</li>
          <li>To personalise your experience and surface relevant content.</li>
          <li>To send you account-related notifications (no marketing without consent).</li>
          <li>To enforce our Community Guidelines and Terms of Service.</li>
        </ul>
      </section>

      <section>
        <h2>Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share anonymised, aggregated data for
          analytics purposes. We will only disclose your data to third parties when required by
          law or to protect the safety of our users.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Groove uses essential cookies to keep you logged in and remember your preferences.
          We do not use tracking or advertising cookies.
        </p>
      </section>

      <section>
        <h2>Your Rights</h2>
        <ul>
          <li>Access or download a copy of your data at any time.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of your account and associated data.</li>
        </ul>
        <p>To exercise any of these rights, contact us at <strong>privacy@groove.app</strong>.</p>
      </section>

      <section>
        <h2>Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Significant changes will be announced via
          a platform notification. Continued use of Groove after changes constitutes acceptance.
        </p>
      </section>
    </div>
  );
}
