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
          // Disable auto registration for now to debug auth issues
          injectRegister: false,
          registerType: "prompt",

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
            
            // Don't cache HTML pages at all
            globPatterns: [
              '**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,json}'
            ],
            
            // Important: Don't cache navigation requests
            navigateFallback: null,
            
            runtimeCaching: [
              // Critical: Don't cache any Supabase API calls for authentication
              {
                urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/auth\/.*/i,
                handler: "NetworkOnly",
              },
              // Don't cache any Supabase REST API calls
              {
                urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/.*/i,
                handler: "NetworkOnly",
              },
              // Don't cache Supabase realtime
              {
                urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/realtime\/.*/i,
                handler: "NetworkOnly",
              },
              // For navigation requests, always use network only
              {
                urlPattern: ({ request }) => request.mode === "navigate",
                handler: "NetworkOnly",
              },
              // Cache static assets
              {
                urlPattern: /\.(?:js|css|woff2|woff|ttf|eot|ico|svg|png|jpg|jpeg|gif|webp)$/,
                handler: "CacheFirst",
                options: {
                  cacheName: "static-assets",
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                  },
                },
              },
            ],
          },

          // Disable in development to avoid service worker issues
          devOptions: {
            enabled: false,
          },
          
          // Disable automatic registration
          selfDestroying: true,
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
