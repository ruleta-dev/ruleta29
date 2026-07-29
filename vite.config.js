import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@solana-program/token": "./src/shims/solana-program-token.js",
      "@solana-program/token-2022": "./src/shims/solana-program-token-2022.js",
      "@solana-program/memo": "./src/shims/solana-program-memo.js",
    },
  },
});
