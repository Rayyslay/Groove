import { useEffect, useRef } from "react";

/**
 * useScrollReveal
 * Attaches an IntersectionObserver to the returned ref.
 * When the element enters the viewport, adds the "visible" class.
 *
 * @param {object} options
 * @param {number} options.threshold - 0–1, how much of element must be visible (default 0.15)
 * @param {string} options.rootMargin - CSS margin around root (default "0px")
 * @param {boolean} options.once - if true, stops observing after first trigger (default true)
 */
export function useScrollReveal({ threshold = 0.15, rootMargin = "0px", once = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          if (once) observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}