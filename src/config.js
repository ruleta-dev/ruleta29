const DEFAULT_RPC_BY_CHAIN = {
  "solana:mainnet": [
    "https://api.mainnet.solana.com",
    "https://solana-rpc.publicnode.com",
    "https://rpc.ankr.com/solana",
    "https://solana-api.projectserum.com",
  ],
  "solana:devnet": ["https://api.devnet.solana.com"],
  "solana:testnet": ["https://api.testnet.solana.com"],
};

const HARDCODED_CONFIG = {
  VITE_PRIVY_APP_ID: "cms3y5sua05el0cjmhbnhaj1j",
  VITE_FUNDING_WALLET: "5Lh4aNFSUo6oDu2z1euBLd6y1JEpE2VG1rd2UTdqopRd",
  VITE_SOLANA_CHAIN: "solana:mainnet",
  VITE_SOLANA_RPC_URL: "https://api.mainnet.solana.com",
};

const runtimeConfig =
  typeof window !== "undefined" && window.__APP_CONFIG__
    ? window.__APP_CONFIG__
    : {};

function readConfig(key) {
  return runtimeConfig[key] ?? import.meta.env[key] ?? HARDCODED_CONFIG[key] ?? "";
}

export const appConfig = {
  privyAppId: readConfig("VITE_PRIVY_APP_ID"),
  fundingWallet: readConfig("VITE_FUNDING_WALLET"),
  solanaChain: readConfig("VITE_SOLANA_CHAIN") || "solana:devnet",
};

export const solanaRpcUrls = [
  readConfig("VITE_SOLANA_RPC_URL"),
  ...(DEFAULT_RPC_BY_CHAIN[appConfig.solanaChain] ??
    DEFAULT_RPC_BY_CHAIN["solana:devnet"]),
].filter((value, index, items) => Boolean(value) && items.indexOf(value) === index);

export const solanaRpcUrl = solanaRpcUrls[0];

export const missingConfig = [
  !appConfig.privyAppId && "VITE_PRIVY_APP_ID",
  !appConfig.fundingWallet && "VITE_FUNDING_WALLET",
].filter(Boolean);

export const isConfigReady =
  missingConfig.length === 0;
