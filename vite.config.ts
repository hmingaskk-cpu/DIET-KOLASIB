import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
    },

    plugins: [
      dyadComponentTagger(),
      react(),

      mode === "production" &&
        VitePWA({
          injectRegister: null,
          registerType: "autoUpdate",

          includeAssets: [
            "favicon.ico",
            "apple-touch-icon.png",
            "masked-icon.svg",
          ],

          manifest: {
            name: "DIET KOLASIB",
            short_name: "DIET KOLASIB",
            description: "Educational Management System for DIET Kolasib",
            theme_color: "#1E40AF",
            display: "standalone",
            icons: [
              {
                src: "pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
              {
                src: "pwa-512x512.png",
                sizes: "512x512",
                type: "image/png",
              },
              {
                src: "pwa-512x512.maskable.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
              },
            ],
          },

          workbox: {
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,

            globPatterns: [],

            // Fix: remove invalid denylist rule
            navigateFallback: undefined,
            navigateFallbackAllowlist: [/^\/$/],
            navigateFallbackDenylist: [],

            runtimeCaching: [
              {
                urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/.*/i,
                handler: "NetworkOnly",
              },
              {
                urlPattern: ({ request }) => request.mode === "navigate",
                handler: "NetworkFirst",
                options: {
                  cacheName: "html-cache",
                  expiration: {
                    maxEntries: 5,
                    maxAgeSeconds: 60 * 60,
                  },
                },
              },
            ],
          },
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
