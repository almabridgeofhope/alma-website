import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component that automatically scrolls to the top of the page
 * when the route changes, unless there's a hash fragment in the URL (for anchor links).
 * Only scrolls on actual navigation, not on browser back/forward.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const prevPathnameRef = useRef(pathname);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathnameRef.current = pathname;
      return;
    }

    // Only scroll if pathname actually changed (not just hash)
    if (prevPathnameRef.current !== pathname) {
      // Only scroll to top if there's no hash fragment
      // Hash fragments are used for anchor links within the same page
      if (!hash) {
        // Use instant scroll for better reliability
        window.scrollTo({ top: 0, behavior: 'auto' });
        // Then smooth scroll if needed
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
      prevPathnameRef.current = pathname;
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;

