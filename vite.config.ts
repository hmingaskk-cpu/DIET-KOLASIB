import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),

    // Enable PWA only in production
    mode === "production" &&
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null, // <--- VERY IMPORTANT


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

        // 🔥 FIX: Do NOT precache index.html or JS bundles
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,

          // Ensure no precaching
    globPatterns: [],

    // Prevent Workbox from trying to route index.html
    navigateFallback: undefined,
    navigateFallbackAllowlist: [],
    navigateFallbackDenylist: [/./],

          // Prevent caching Supabase requests (critical)
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/.*/i,
              handler: "NetworkOnly",
            },

            // For navigation: use Network-First so app always updates
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
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
}));
