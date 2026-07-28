import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/*.svg", "offline.html"],
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 500 * 1024,
        globPatterns: ["**/*.{html,js,css,svg,webmanifest}"],
        globIgnores: [
          "**/models/**",
          "**/images/**",
          "**/stats.html",
          "**/assets/MapView-*.js",
          "**/assets/MapView-*.css",
          "**/assets/mapbox-gl-*.js",
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
          if (id.includes("react-dom") || /node_modules[\\/]react[\\/]/.test(id)) {
            return "react";
          }
          return undefined;
        },
      },
    },
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
