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

const runtimeConfig =
  typeof window !== "undefined" && window.__APP_CONFIG__
    ? window.__APP_CONFIG__
    : {};

function readConfig(key) {
  return runtimeConfig[key] ?? import.meta.env[key] ?? "";
}

export const appConfig = {
  privyAppId: readConfig("VITE_PRIVY_APP_ID"),
  fundingWallet: readConfig("VITE_FUNDING_WALLET"),
  transferSol: readConfig("VITE_TRANSFER_SOL"),
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
  !appConfig.transferSol && "VITE_TRANSFER_SOL",
].filter(Boolean);

export const parsedTransferSol = Number(appConfig.transferSol);

export const hasValidTransferAmount =
  Number.isFinite(parsedTransferSol) && parsedTransferSol > 0;

export const isConfigReady =
  missingConfig.length === 0 && hasValidTransferAmount;
