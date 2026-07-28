function notAvailable(name) {
  return function () {
    throw new Error(
      `@solana-program/memo is not available (stub). ${name}() called. This app does not use memo instructions.`,
    );
  };
}

export const getAddMemoInstruction = notAvailable("getAddMemoInstruction");
export const getCreateMemoInstruction = notAvailable("getCreateMemoInstruction");
