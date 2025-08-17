import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['fsevents'],
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: "/src" }
    ]
  }
});
