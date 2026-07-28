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

export const appConfig = {
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID ?? "",
  fundingWallet: import.meta.env.VITE_FUNDING_WALLET ?? "",
  transferSol: import.meta.env.VITE_TRANSFER_SOL ?? "",
  solanaChain: import.meta.env.VITE_SOLANA_CHAIN ?? "solana:devnet",
};

export const solanaRpcUrls = [
  import.meta.env.VITE_SOLANA_RPC_URL,
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
