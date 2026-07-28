import { address } from "@solana/kit";

export const TOKEN_2022_PROGRAM_ADDRESS = address(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);

export const TOKEN_PROGRAM_ADDRESS = address(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

export const ASSOCIATED_TOKEN_PROGRAM_ADDRESS = address(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

function notAvailable(name) {
  return function () {
    throw new Error(
      `@solana-program/token-2022 is not available (stub). ${name}() called. This app does not use SPL token-2022 instructions.`,
    );
  };
}

export const getCreateAssociatedTokenIdempotentInstruction = notAvailable(
  "getCreateAssociatedTokenIdempotentInstruction",
);
export const getTransferInstruction = notAvailable("getTransferInstruction");
export const getTransferCheckedInstruction = notAvailable(
  "getTransferCheckedInstruction",
);
export const getInitializeMintInstruction = notAvailable(
  "getInitializeMintInstruction",
);
export const getInitializeAccountInstruction = notAvailable(
  "getInitializeAccountInstruction",
);
export const getMintToInstruction = notAvailable("getMintToInstruction");
export const getBurnInstruction = notAvailable("getBurnInstruction");
export const getCloseAccountInstruction = notAvailable(
  "getCloseAccountInstruction",
);

export async function fetchMint() {
  throw new Error(
    "@solana-program/token-2022 is not available (stub). fetchMint() called. This app does not use SPL token-2022 instructions.",
  );
}

export async function fetchToken() {
  throw new Error(
    "@solana-program/token-2022 is not available (stub). fetchToken() called.",
  );
}

export function findAssociatedTokenPda() {
  throw new Error(
    "@solana-program/token-2022 is not available (stub). findAssociatedTokenPda() called.",
  );
}
