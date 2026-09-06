import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { VitePWA } from "vite-plugin-pwa";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: false,

      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],

  clearScreen: false,

  // GitHub Pages
  base: "./",

  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,

    allowedHosts: true,

    watch: {
      ignored: ["**/src/tests/**"],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
});