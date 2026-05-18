import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets window scroll position to the top on every route change.
 * Mounted once inside <BrowserRouter> (see main.jsx / App.jsx).
 *
 * Skipped when the URL carries a hash (e.g. /profile/foo#post-42) so pages
 * that scroll to a specific anchor (Profile post deep-link) aren't fighting
 * with this effect.
 */
export default function ScrollToTopOnNavigate() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
