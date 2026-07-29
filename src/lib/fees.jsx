import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const SOL_FEE_RESERVE_LAMPORTS = 10_000;

export function estimateMinimumSolForFees(assets, solBalance) {
  const splCount = assets.filter((asset) => asset.type === "spl").length;
  const includeSol = assets.some((asset) => asset.id === "sol");
  const estimatedTxCount = splCount + (includeSol ? 1 : 0);
  const estimatedFees = Math.max(estimatedTxCount * 0.00015, 0.00001);
  const recommendedReserve = Math.max(
    estimatedFees,
    splCount > 0 ? 0.003 : 0.00002,
  );

  let hasEnoughSol = solBalance >= recommendedReserve;

  if (includeSol && splCount === 0) {
    hasEnoughSol = solBalance > SOL_FEE_RESERVE_LAMPORTS / LAMPORTS_PER_SOL;
  }

  return {
    estimatedFees,
    hasEnoughSol,
    recommendedReserve,
  };
}

export function getSolAsset(balance) {
  return {
    id: "sol",
    type: "sol",
    symbol: "SOL",
    name: "Solana",
    amount: balance,
    rawAmount: BigInt(Math.floor(balance * LAMPORTS_PER_SOL)),
    decimals: 9,
  };
}