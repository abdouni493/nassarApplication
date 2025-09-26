// autoParts/website/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger"; // Include if this dependency is used

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // 💡 CRITICAL CHANGE: Sets the base path for production assets.
  base: "/website/",
  
  server: {
    // This is optional for the website project, but helpful for development
    host: "::",
    port: 8081, // Use a different port than the root app's 8080 for dev
  },
  plugins: [
    react(),
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
