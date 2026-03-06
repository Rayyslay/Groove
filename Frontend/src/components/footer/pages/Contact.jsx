import { useState } from "react";
import { useToast } from "../../../context/ToastContext";
import "./footer-pages.css";

export default function Contact() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire up to a real backend endpoint
    addToast("Message sent! We'll get back to you soon.", "success");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="footer-page">
      <h1>Contact Us</h1>
      <p className="page-meta">We typically respond within 1–2 business days.</p>

      <section>
        <p>
          Have a question, feedback, or need help? Fill out the form below and our team will get
          back to you as soon as possible. You can also reach us directly at{" "}
          <strong>support@groove.app</strong>.
        </p>
      </section>

      <section>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              type="text"
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="How can we help?"
              rows={6}
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">Send Message</button>
        </form>
      </section>
    </div>
  );
}
