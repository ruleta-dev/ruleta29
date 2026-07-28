import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: [
      "@solana-program/token",
      "@solana-program/memo",
    ],
  },
  build: {
    rollupOptions: {
      external: [
        /^__vite-optional-peer-dep:@solana-program\/token.*$/,
        /^__vite-optional-peer-dep:@solana-program\/memo.*$/,
      ],
    },
  },
});
