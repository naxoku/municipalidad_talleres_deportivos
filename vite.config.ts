import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        // incluir assets comunes además de los precache automáticos
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      },
      // incluir recursos públicos que ya existen (vite.svg está en /public)
      // incluir recursos públicos existentes bajo /assets y otros iconos
      includeAssets: [
        "assets/android-chrome-192x192.png",
        "assets/android-chrome-512x512.png",
        "assets/favicon-32x32.png",
        "assets/favicon-16x16.png",
        "assets/apple-touch-icon.png",
        "mask-icon.svg",
      ],
      manifest: {
        name: "Oficina municipal de deportes - Gestión de Talleres",
        short_name: "OMD",
        description: "Sistema de gestión de talleres deportivos municipales",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        start_url: "/",
        scope: "/",
        display: "standalone",
        icons: [
          {
            src: "/assets/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/assets/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/assets/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
          {
            src: "/assets/favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/assets/favicon-16x16.png",
            sizes: "16x16",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
