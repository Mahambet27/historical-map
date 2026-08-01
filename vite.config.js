import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const p2a5LocalVerificationPlugin = () => ({
  name: "p2a5-local-verification",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use(
      "/__p2a5/verification",
      async (request, response) => {
        if (request.method !== "GET") {
          response.statusCode = 405;
          response.end();
          return;
        }
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        try {
          const content = await readFile(
            path.join(process.cwd(), ".p2a5", "verification.json"),
            "utf8"
          );
          response.statusCode = 200;
          response.end(content);
        } catch {
          response.statusCode = 404;
          response.end('{"available":false,"sections":{}}');
        }
      }
    );
  },
});

export default defineConfig(({ mode }) => ({
  optimizeDeps: {
    include: [
      "@turf/difference",
      "@turf/helpers",
      "@turf/intersect",
      "@turf/union",
    ],
  },
  plugins: [
    react(),
    p2a5LocalVerificationPlugin(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "icons/*.svg",
        "offline.html",
        "models/exhibition/posters/*.webp",
      ],
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 900 * 1024,
        globPatterns: ["**/*.{html,js,css,svg,webmanifest}"],
        globIgnores: [
          "**/models/**",
          "**/images/**",
          "**/stats.html",
          "**/assets/MapView-*.js",
          "**/assets/MapView-*.css",
          "**/assets/mapbox-gl-*.js",
          "**/assets/model-viewer-*.js",
          "**/assets/supabase-*.js",
          "**/assets/supabaseClient-*.js",
          "**/assets/SupabaseHistoricalRepository-*.js",
        ],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin && url.pathname.endsWith(".json"),
            handler: "NetworkFirst",
            options: {
              cacheName: "qhm-json-v1",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              /\/assets\/model-viewer-[^/]+\.js$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "qhm-model-viewer-v1",
              expiration: { maxEntries: 2, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
    mode === "analyze" &&
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
      }),
  ].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/@google/model-viewer") ||
            id.includes("node_modules/@lit") ||
            /node_modules[\\/]lit[\\/]/.test(id) ||
            id.includes("node_modules/three")
          ) {
            return "model-viewer";
          }
          if (id.includes("node_modules/@supabase")) {
            return "supabase";
          }
          if (id.includes("react-dom") || /node_modules[\\/]react[\\/]/.test(id)) {
            return "react";
          }
          return undefined;
        },
      },
    },
  },
  worker: {
    format: "es",
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/config/env.js",
        "src/lib/logger.js",
        "src/components/map/mapViewUtils.js",
        "src/features/map/utils/**",
        "src/features/map/services/**",
      ],
      thresholds: { lines: 55, functions: 55, statements: 55, branches: 45 },
    },
  },
}));
