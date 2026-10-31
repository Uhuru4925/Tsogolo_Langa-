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

  }, []);

  return null;
}
