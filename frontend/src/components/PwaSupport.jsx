import React, { useEffect, useState } from "react";
import { isPwaStandaloneMode } from "../pwa/registerServiceWorker";
import "./PwaSupport.css";

const DISMISS_KEY = "pwa-install-dismissed";

const PwaSupport = () => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [installEvent, setInstallEvent] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
    if (dismissed || isPwaStandaloneMode()) return;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice?.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setInstallEvent(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setShowInstallBanner(false);
  };

  return (
    <>
      {!isOnline ? (
        <div className="pwa-offline-banner" role="status" aria-live="polite">
          You are offline. Cached pages are available. Live alerts sync when connection returns.
        </div>
      ) : (
        <div className="pwa-online-dot" aria-label="Online status" title="Online" />
      )}

      {showInstallBanner && installEvent ? (
        <div className="pwa-install-banner" role="dialog" aria-live="polite">
          <p>Install Natural Disaster Alert System for faster access and offline support.</p>
          <div className="pwa-install-actions">
            <button type="button" className="pwa-install-btn" onClick={handleInstall}>
              Install app
            </button>
            <button type="button" className="pwa-dismiss-btn" onClick={handleDismiss}>
              Not now
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default PwaSupport;
