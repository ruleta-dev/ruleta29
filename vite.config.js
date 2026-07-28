import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@solana-program/token": fileURLToPath(
        new URL("./src/shims/solana-program-token.js", import.meta.url),
      ),
      "@solana-program/token-2022": fileURLToPath(
        new URL("./src/shims/solana-program-token-2022.js", import.meta.url),
      ),
      "@solana-program/memo": fileURLToPath(
        new URL("./src/shims/solana-program-memo.js", import.meta.url),
      ),
    },
  },
});
