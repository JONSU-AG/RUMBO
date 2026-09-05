/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Por variables de entorno (para pruebas)
const enableStorybookTests = !process.env.SKIP_STORYBOOK_TESTS;

export default defineConfig({
  plugins: [tailwindcss(), react()],
  clearScreen: false,
  base: './', // Ensures assets load correctly on GitHub Pages
  server: {
    port: 3000, // Mantengo tu puerto 3000 original en lugar de 1420
    strictPort: false,
    open: true,
    watch: {
      ignored: ["**/src/tests/**"]
    }
  }
});
