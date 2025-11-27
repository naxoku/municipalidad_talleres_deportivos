// @ts-nocheck
/* Custom service worker for injectManifest via VitePWA.
   - Enables navigation preload
   - Uses event.respondWith and awaits event.preloadResponse
   - Precaches assets injected by workbox (self.__WB_MANIFEST)
*/

import { precacheAndRoute } from "workbox-precaching";

// @ts-ignore - workbox injects the manifest at build time
precacheAndRoute(self.__WB_MANIFEST || []);

// Enable navigation preload on activate so the browser can start fetching
// the main document while the service worker starts up.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        // If navigationPreload is supported, enable it
        if (self.registration && (self.registration as any).navigationPreload) {
          await (self.registration as any).navigationPreload.enable();
        }
      } catch {
        // ignore failures
      }

      // Claim clients immediately
      if ((self as any).clients && (self as any).clients.claim) {
        await (self as any).clients.claim();
      }
    })(),
  );
});

// Handle navigation requests and wait for preloadResponse to settle
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        // await preloadResponse if available
        try {
          const preloadResp = await (event as any).preloadResponse;

          if (preloadResp) return preloadResp;
        } catch {
          // preloadResponse might be rejected/cancelled; continue to network
        }

        // Fallback: try network first, otherwise cached index.html
        try {
          const response = await fetch(req);

          return response;
        } catch {
          const cache = await caches.open("offline-fallback");
          const cached = await cache.match("/index.html");

          if (cached) return cached;

          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        }
      })(),
    );
  }
});
