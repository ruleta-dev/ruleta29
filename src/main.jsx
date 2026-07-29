import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles.css";

async function loadRuntimeConfig() {
  try {
    const response = await fetch("/app-config.json", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    window.__APP_CONFIG__ = await response.json();
  } catch {
    // Local Vite dev keeps using import.meta.env when the runtime endpoint is absent.
  }
}

async function bootstrap() {
  await loadRuntimeConfig();
  const { default: App } = await import("./App");

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

bootstrap();
