import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), react()],

  clearScreen: false,

  // GitHub Pages
  base: "./",

  server: {
    port: 3000,
    strictPort: false,
    open: true,
    watch: {
      ignored: ["**/src/tests/**"],
    },
  },
});
