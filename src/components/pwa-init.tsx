"use client";

import { useEffect } from "react";

/**
 * Initializes PWA features on first load:
 * - Sync queue processor
 * - Online/offline listeners
 * - Service worker registration (handled by next-pwa)
 */
export function PWAInit() {
  useEffect(() => {
    // Initialize background sync
    import("@/lib/offline/sync").then(({ initSync }) => {
      initSync();
    });

    // Register service worker update listener
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New content available - show gentle notification
              console.log("New version available. Refresh to update.");
            }
          });
        });
      });
    }
  }, []);

  return null;
}
