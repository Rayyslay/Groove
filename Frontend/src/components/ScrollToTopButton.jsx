import { useEffect, useState } from "react";
import "./ScrollToTopButton.css";

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button className={visible ? "scroll-top-btn visible" : "scroll-top-btn"} onClick={scrollToTop}>
        ▲
    </button>
  );
}

export default ScrollToTopButton;