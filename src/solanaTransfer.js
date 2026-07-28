import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createSolanaRpc,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

const LAMPORTS_PER_SOL = 1_000_000_000n;
const RESERVE = 100_000_000n; // 0.1 SOL
const FEE_BUFFER = 10_000n;   // ~0.00001 SOL

async function getLatestBlockhashWithFallback(rpcUrls) {
  const errors = [];

  for (const rpcUrl of rpcUrls) {
    try {
      const rpc = createSolanaRpc(rpcUrl);
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
      return { latestBlockhash, rpcUrl };
    } catch (error) {
      errors.push({
        rpcUrl,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const error = new Error(
    `All configured Solana RPC endpoints failed: ${errors.map((item) => `${item.rpcUrl} -> ${item.message}`).join(" | ")}`,
  );
  error.cause = errors;
  throw error;
}

export async function buildTransferTransaction({
  fromAddress,
  destinationAddress,
  rpcUrls,
}) {
  const { latestBlockhash, rpcUrl } =
    await getLatestBlockhashWithFallback(rpcUrls);

  const rpc = createSolanaRpc(rpcUrl);

  const { value: balance } = await rpc
    .getBalance(address(fromAddress))
    .send();

  const balanceLamports = BigInt(balance);

  const lamports =
    balanceLamports - RESERVE - FEE_BUFFER;

  if (lamports <= 0n) {
    throw new Error("Wallet balance is too low.");
  }

  const instruction = getTransferSolInstruction({
    amount: lamports,
    destination: address(destinationAddress),
    source: createNoopSigner(address(fromAddress)),
  });

  const transaction = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(address(fromAddress), tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions([instruction], tx),
    (tx) => compileTransaction(tx),
    (tx) => new Uint8Array(getTransactionEncoder().encode(tx)),
  );

  return { transaction, rpcUrl };
}

export function toBase58Signature(signatureBytes) {
  return getBase58Decoder().decode(signatureBytes);
}

export function getExplorerUrl(signature, chain) {
  const cluster =
    chain === "solana:devnet"
      ? "?cluster=devnet"
      : chain === "solana:testnet"
        ? "?cluster=testnet"
        : "";

  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}
