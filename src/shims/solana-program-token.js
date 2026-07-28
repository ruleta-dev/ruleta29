import { address } from "@solana/kit";

export function getCreateAssociatedTokenIdempotentInstruction() {
  throw new Error(
    "@solana-program/token is not available. This app does not use token instructions.",
  );
}

export function getTransferInstruction() {
  throw new Error(
    "@solana-program/token is not available. This app does not use token transfer instructions.",
  );
}
