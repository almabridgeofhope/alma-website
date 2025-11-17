import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_CONSENT_EXPIRY_DAYS = 365;

type ConsentStatus = "granted" | "denied" | null;

// Function to show cookie banner again (can be called from outside)
export const showCookieBanner = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("showCookieBanner"));
  }
};

const CookieBanner = () => {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const consent = JSON.parse(savedConsent);
        setAnalyticsConsent(consent.analytics);
        updateGoogleConsent(consent.analytics);
      } catch (e) {
        setShowBanner(true);
      }
    }

    // Listen for custom event to show banner again
    const handleShowBanner = () => {
      setShowBanner(true);
    };
    window.addEventListener("showCookieBanner", handleShowBanner);
    return () => {
      window.removeEventListener("showCookieBanner", handleShowBanner);
    };
  }, []);

  const updateGoogleConsent = (analytics: ConsentStatus) => {
    if (typeof window === "undefined") return;
    
    // Wait for gtag to be available, with a timeout
    const tryUpdate = (attempts = 0) => {
      if (window.gtag) {
        const consentValue = analytics === "granted" ? "granted" : "denied";
        
        window.gtag("consent", "update", {
          analytics_storage: consentValue,
          ad_storage: "denied", // We don't use ads
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
        
        // If consent is denied, also try to remove any existing Google Analytics cookies
        if (analytics === "denied") {
          // Remove Google Analytics cookies
          const gaCookies = [
            "_ga",
            "_ga_",
            "_gid",
            "_gat",
            "_gat_gtag_",
          ];
          
          gaCookies.forEach((cookieName) => {
            // Remove cookies for current domain
            document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
            document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
            // Also try with . prefix for subdomain cookies
            if (window.location.hostname.includes(".")) {
              const domain = "." + window.location.hostname.split(".").slice(-2).join(".");
              document.cookie = `${cookieName}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
            }
          });
        }
      } else if (attempts < 10) {
        // Retry up to 10 times (waiting for gtag to load)
        setTimeout(() => tryUpdate(attempts + 1), 100);
      }
    };
    
    tryUpdate();
  };

  const saveConsent = (analytics: ConsentStatus) => {
    const consentData = {
      analytics,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setAnalyticsConsent(analytics);
    updateGoogleConsent(analytics);
    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    saveConsent("granted");
  };

  const handleRejectAll = () => {
    saveConsent("denied");
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {t("cookieBanner.description")}{" "}
              <Link
                to="/privacy"
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t("cookieBanner.privacyLink")}
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              className="w-full sm:w-auto"
            >
              {t("cookieBanner.reject")}
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="w-full sm:w-auto"
            >
              {t("cookieBanner.accept")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;

