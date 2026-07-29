import { Connection, PublicKey } from "@solana/web3.js";
import { solanaRpcUrls } from "../config";

export const EXPLORER_URL = "https://solscan.io/tx";

function getRpcCandidates() {
  if (solanaRpcUrls.length > 0) {
    return solanaRpcUrls;
  }

  return ["https://api.mainnet-beta.solana.com"];
}

let cachedRpcUrl = null;

export async function getWorkingConnection() {
  if (cachedRpcUrl) {
    return new Connection(cachedRpcUrl, "confirmed");
  }

  let lastError;

  for (const url of getRpcCandidates()) {
    try {
      const connection = new Connection(url, "confirmed");
      await connection.getLatestBlockhash("confirmed");
      cachedRpcUrl = url;
      return connection;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No RPC endpoint available");
}

export function getConnection() {
  const [primary] = getRpcCandidates();
  return new Connection(
    cachedRpcUrl ?? primary ?? `${window.location.origin}/api/rpc`,
    "confirmed",
  );
}

export function resetRpcCache() {
  cachedRpcUrl = null;
}

export function isValidSolanaAddress(address) {
  try {
    const key = new PublicKey(address);
    return PublicKey.isOnCurve(key.toBytes());
  } catch {
    return false;
  }
}

export function truncateAddress(address, chars = 4) {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatAmount(amount, decimals = 4) {
  if (amount === 0) return "0";
  if (amount < 0.0001) return amount.toExponential(2);
  return amount.toFixed(Math.min(decimals, 6));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatTransactionError(error) {
  const asText = JSON.stringify(error);

  if (asText.includes("InsufficientFundsForRent")) {
    return "insufficient_rent";
  }

  if (asText.includes("insufficient lamports") || asText.includes('"Custom":1')) {
    return "insufficient_lamports";
  }

  if (asText.includes("Account is frozen") || asText.includes('"Custom":17')) {
    return "frozen_account";
  }

  return "unknown";
}

export async function waitForTransactionConfirmation(signature, options) {
  const connection = await getWorkingConnection();
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const pollIntervalMs = 2_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = response.value[0];

    if (status?.err) {
      throw new Error(formatTransactionError(status.err));
    }

    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return;
    }

    await sleep(pollIntervalMs);
  }

  const response = await connection.getSignatureStatuses([signature], {
    searchTransactionHistory: true,
  });
  const status = response.value[0];

  if (status?.err) {
    throw new Error(formatTransactionError(status.err));
  }

  if (
    status?.confirmationStatus === "confirmed" ||
    status?.confirmationStatus === "finalized"
  ) {
    return;
  }

  throw new Error(`confirmation_timeout:${signature}`);
}
