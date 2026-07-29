const JUPITER_PRICE_API = "https://lite-api.jup.ag/price/v3";

function getPricesEndpoint() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/prices`;
  }
  return JUPITER_PRICE_API;
}

export async function fetchTokenPricesUsd(mints) {
  const uniqueMints = [...new Set(mints)];
  if (uniqueMints.length === 0) return new Map();

  const response = await fetch(
    `${getPricesEndpoint()}?ids=${uniqueMints.join(",")}`,
  );

  if (!response.ok) {
    throw new Error(`Price API error: ${response.status}`);
  }

  const data = await response.json();
  const prices = new Map();

  for (const [mint, entry] of Object.entries(data)) {
    if (typeof entry?.usdPrice === "number" && entry.usdPrice > 0) {
      prices.set(mint, entry.usdPrice);
    }
  }

  return prices;
}

export function getWalletUsdValue(amount, priceUsd) {
  if (priceUsd === undefined) return 0;
  return amount * priceUsd;
}

export function formatUsd(value) {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}