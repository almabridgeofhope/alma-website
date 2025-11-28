import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

/**
 * NetworkRecovery Component
 * 
 * Handles network connection issues that occur after periods of inactivity,
 * particularly Chrome error code 5 (ERR_NAME_NOT_RESOLVED) which can occur
 * when external resources fail to load after the connection has been idle.
 */
const NetworkRecovery = () => {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastVisibilityChange, setLastVisibilityChange] = useState(Date.now());
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check network connectivity
  const checkConnectivity = async (): Promise<boolean> => {
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        // Try to fetch a small resource to verify connectivity
        const response = await fetch('/favicon.svg', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.warn('[NetworkRecovery] Connectivity check failed:', error);
      return false;
    }
  };

  // Retry loading the page
  const handleRetry = async () => {
    setIsRetrying(true);
    setHasError(false);

    try {
      // Check connectivity first
      const isConnected = await checkConnectivity();
      
      if (!isConnected) {
        // If still not connected, wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryConnected = await checkConnectivity();
        
        if (!retryConnected) {
          setHasError(true);
          setIsRetrying(false);
          return;
        }
      }

      // If connected, reload the page to refresh all resources
      window.location.reload();
    } catch (error) {
      console.error('[NetworkRecovery] Retry failed:', error);
      setHasError(true);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = async () => {
      console.log('[NetworkRecovery] Network connection restored');
      setIsOnline(true);
      
      // If we had an error and now we're online, check connectivity
      if (hasError) {
        const isConnected = await checkConnectivity();
        if (isConnected) {
          setHasError(false);
        }
      }
    };

    const handleOffline = () => {
      console.warn('[NetworkRecovery] Network connection lost');
      setIsOnline(false);
      setHasError(true);
    };

    // Monitor page visibility changes (when user returns after inactivity)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastVisible = now - lastVisibilityChange;
        setLastVisibilityChange(now);

        // If page was hidden for more than 30 seconds, check connectivity
        if (timeSinceLastVisible > 30000) {
          console.log('[NetworkRecovery] Page became visible after inactivity, checking connectivity...');
          
          const isConnected = await checkConnectivity();
          if (!isConnected || !navigator.onLine) {
            console.warn('[NetworkRecovery] Connectivity issue detected after inactivity');
            setHasError(true);
          }
        }
      } else {
        // Page became hidden, update timestamp
        setLastVisibilityChange(Date.now());
      }
    };

    // Monitor for network errors in resource loading
    const handleError = (event: ErrorEvent) => {
      // Check if it's a network-related error
      const errorMessage = event.message?.toLowerCase() || '';
      const filename = event.filename?.toLowerCase() || '';
      const isNetworkError = 
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('networkerror') ||
        errorMessage.includes('load failed') ||
        errorMessage.includes('err_name_not_resolved') ||
        errorMessage.includes('dns') ||
        errorMessage.includes('timeout') ||
        filename.includes('googletagmanager') ||
        filename.includes('fonts.googleapis') ||
        filename.includes('github.io') || // GitHub Pages CDN
        filename.includes('githubusercontent'); // GitHub assets

      if (isNetworkError) {
        console.warn('[NetworkRecovery] Network error detected:', {
          message: event.message,
          filename: event.filename,
          type: 'ErrorEvent'
        });
        setHasError(true);
      }
    };

    // Monitor for unhandled promise rejections (often network errors)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString()?.toLowerCase() || '';
      const isNetworkError = 
        reason.includes('failed to fetch') ||
        reason.includes('networkerror') ||
        reason.includes('load failed') ||
        reason.includes('err_name_not_resolved') ||
        reason.includes('dns') ||
        reason.includes('timeout') ||
        reason.includes('network request failed');

      if (isNetworkError) {
        console.warn('[NetworkRecovery] Network rejection detected:', {
          reason: event.reason,
          type: 'PromiseRejection'
        });
        setHasError(true);
      }
    };

    // Set initial online status
    setIsOnline(navigator.onLine);

    // Keep-alive mechanism: periodically check connectivity when page is visible
    // This helps prevent connection timeouts that cause Chrome error code 5
    const startKeepAlive = () => {
      // Clear any existing interval
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      
      // Only run keep-alive when page is visible and online
      if (document.visibilityState === 'visible' && navigator.onLine) {
        keepAliveIntervalRef.current = setInterval(async () => {
          // Silently check connectivity every 2 minutes
          try {
            await checkConnectivity();
          } catch (error) {
            // Silently handle errors - we don't want to spam the user
            console.debug('[NetworkRecovery] Keep-alive check failed:', error);
          }
        }, 120000); // Check every 2 minutes
      }
    };

    const stopKeepAlive = () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };

    // Start keep-alive when page becomes visible
    if (document.visibilityState === 'visible') {
      startKeepAlive();
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('visibilitychange', () => {
      handleVisibilityChange();
      // Restart keep-alive when page becomes visible
      if (document.visibilityState === 'visible') {
        startKeepAlive();
      } else {
        stopKeepAlive();
      }
    });
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Initial connectivity check after a short delay
    const initialCheck = setTimeout(async () => {
      if (!navigator.onLine) {
        setHasError(true);
      } else {
        const isConnected = await checkConnectivity();
        if (!isConnected) {
          setHasError(true);
        }
      }
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      clearTimeout(initialCheck);
      stopKeepAlive();
    };
  }, [hasError, lastVisibilityChange]);

  // Don't show error if we're online and connected
  if (!hasError || (isOnline && !isRetrying)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert variant="destructive" className="shadow-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {isOnline ? (
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              {t('network.error.title') || 'Connection Issue Detected'}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              {t('network.error.offline') || 'No Internet Connection'}
            </div>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2">
          {isOnline ? (
            <p>
              {t('network.error.description') || 
                'Some resources failed to load. This can happen after periods of inactivity. Please try reloading the page.'}
            </p>
          ) : (
            <p>
              {t('network.error.offline_description') || 
                'You appear to be offline. Please check your internet connection.'}
            </p>
          )}
        </AlertDescription>
        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="sm"
            variant="default"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t('network.error.retrying') || 'Retrying...'}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('network.error.retry') || 'Reload Page'}
              </>
            )}
          </Button>
          <Button
            onClick={() => setHasError(false)}
            size="sm"
            variant="outline"
          >
            {t('network.error.dismiss') || 'Dismiss'}
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default NetworkRecovery;

