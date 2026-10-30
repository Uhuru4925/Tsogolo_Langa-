/**
 * PWA configuration for next-pwa
 * Caches critical pages and assets for offline use.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require("next-pwa");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
  runtimeCaching: [
    {
      urlPattern: /^\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24,
        },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /\.(?:js|css|woff2?)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: ({ url, request }: { url: URL; request: Request }) =>
        request.method === "GET" &&
        url.pathname.startsWith("/plan/") &&
        url.pathname.match(/\/\d+$/),
      handler: "NetworkFirst",
      options: {
        cacheName: "plan-pages",
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: ({ url, request }: { url: URL; request: Request }) =>
        request.method === "GET" &&
        url.pathname.startsWith("/results/"),
      handler: "NetworkFirst",
      options: {
        cacheName: "results-pages",
        networkTimeoutSeconds: 3,
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ["!favicon/**", "!fonts/**"],
});

export default withPWA;
