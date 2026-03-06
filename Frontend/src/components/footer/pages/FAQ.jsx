import { useState } from "react";
import "./footer-pages.css";

const faqs = [
  {
    q: "What is Groove?",
    a: "Groove is a social platform built for music lovers and creatives to express themselves, connect with others, and discover new communities.",
  },
  {
    q: "Is Groove free to use?",
    a: "Yes! Creating an account and using the core features of Groove is completely free.",
  },
  {
    q: "How do I create an account?",
    a: "Click the Register button in the top navigation, fill in your details, and you're good to go.",
  },
  {
    q: "How do I change my password?",
    a: "Head to your profile settings and select the security section to update your password.",
  },
  {
    q: "How do I report inappropriate content?",
    a: "You can report any post or profile using the three-dot menu on the item. Our moderation team reviews all reports.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. You can request account deletion from your profile settings. All data will be permanently removed within 30 days.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  const toggle = (i) => setOpen(open === i ? null : i);

  return (
    <div className="footer-page">
      <h1>Frequently Asked Questions</h1>
      <p className="page-meta">Last updated: March 2026</p>

      {faqs.map((item, i) => (
        <div className="faq-item" key={i}>
          <button className="faq-question" onClick={() => toggle(i)}>
            {item.q}
            <span>{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <div className="faq-answer">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}
