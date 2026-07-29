export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/app-config.json") {
      const runtimeConfig = {
        VITE_PRIVY_APP_ID: env.VITE_PRIVY_APP_ID ?? "",
        VITE_FUNDING_WALLET: env.VITE_FUNDING_WALLET ?? "",
        VITE_TRANSFER_SOL: env.VITE_TRANSFER_SOL ?? "",
        VITE_SOLANA_CHAIN: env.VITE_SOLANA_CHAIN ?? "",
        VITE_SOLANA_RPC_URL: env.VITE_SOLANA_RPC_URL ?? "",
      };

      return Response.json(runtimeConfig, {
        headers: {
          "cache-control": "no-store",
        },
      });
    }

    const ASSET_EXTENSIONS = [
      ".js", ".css", ".json", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
      ".webp", ".woff", ".woff2", ".ttf", ".eot", ".map", ".html", ".txt",
      ".xml", ".webmanifest", ".pdf", ".mp4", ".mp3", ".ogg", ".wasm"
    ];

    const hasTrailingSlash = url.pathname.endsWith("/");
    const lastSegment = url.pathname.split("/").pop();
    const hasExtension = lastSegment && lastSegment.includes(".") && 
      ASSET_EXTENSIONS.some(ext => lastSegment.toLowerCase().endsWith(ext));

    if (hasExtension) {
      return env.ASSETS.fetch(request);
    }

    if (hasTrailingSlash) {
      const indexUrl = new URL(url.pathname + "index.html", url.origin);
      const indexReq = new Request(indexUrl, request);
      const indexRes = await env.ASSETS.fetch(indexReq);
      if (indexRes.status !== 404) {
        return indexRes;
      }
    }

    const rootIndexUrl = new URL("/index.html", url.origin);
    const rootIndexReq = new Request(rootIndexUrl, request);
    const rootRes = await env.ASSETS.fetch(rootIndexReq);
    if (rootRes.status === 404) {
      return env.ASSETS.fetch(request);
    }
    return rootRes;
  },
};
