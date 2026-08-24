import path from "path"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/deezer-preview': {
        target: 'https://api.deezer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/deezer-preview', '/search'),
      },
    },
  },
});
