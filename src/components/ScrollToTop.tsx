import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component that automatically scrolls to the top of the page
 * when the route changes, unless there's a hash fragment in the URL (for anchor links).
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Only scroll to top if there's no hash fragment
    // Hash fragments are used for anchor links within the same page
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;

