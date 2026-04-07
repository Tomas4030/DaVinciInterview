"use client";

import { useEffect } from "react";

export default function ClearLegacyServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const clearLegacyCaches = async () => {
      try {
        // Unregister all service workers
        if ("serviceWorker" in navigator) {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map((registration) => registration.unregister()),
          );
        }

        // Clear all caches
        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        }
      } catch {
        // Silently fail to avoid breaking page render
      }
    };

    void clearLegacyCaches();
  }, []);

  return null;
}
