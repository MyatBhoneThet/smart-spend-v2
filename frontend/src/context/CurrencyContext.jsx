// src/context/CurrencyContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "./UserContext";

/** All values in DB are THB. We only convert for display / input. */
const CurrencyContext = createContext(null);

const STORAGE_KEY = "fxRates_THB_cache_v2";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FX_URL = "https://open.er-api.com/v6/latest/THB";

const normalizeLang = (v) => {
  const s = String(v || "en").toLowerCase();
  const map = { english: "en", en: "en", thai: "th", th: "th", burmese: "my", myanmar: "my", my: "my" };
  return map[s] || (s.length > 2 ? s.slice(0, 2) : s);
};

function numberFormat(amount, currency, lang = "en") {
  const n = Number(amount) || 0;

  // Force THB to use ฿ symbol
  if (currency === "THB") return `฿${n.toLocaleString(lang)}`;

  try {
    return new Intl.NumberFormat(lang, { style: "currency", currency }).format(n);
  } catch {
    const symbols = { USD: "$", MMK: "MMK " };
    return `${symbols[currency] || ""}${n.toLocaleString(lang)}`;
  }
}

export const CurrencyProvider = ({ children }) => {
  const { prefs } = useContext(UserContext) || {};
  const targetCurrency = String(prefs?.currency || "THB").toUpperCase();
  const language = normalizeLang(prefs?.language || "en");

  const [rates, setRates] = useState({ THB: 1 });
  const [lastUpdated, setLastUpdated] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cache
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.rates) {
          setRates({ ...parsed.rates, THB: 1 });
          setLastUpdated(parsed.lastUpdated || 0);
        }
      }
    } catch {
        // ignore
    }
  }, []);

  // Refresh if stale/missing
  useEffect(() => {
    const stale = Date.now() - (lastUpdated || 0) > ONE_DAY_MS;
    if (!rates?.USD || !rates?.MMK || stale) refreshRates();
  }, [lastUpdated]);

  const refreshRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(FX_URL, { cache: "no-store" });
      const json = await res.json();
      const r = { ...(json?.rates || {}), THB: 1 };
      const ts = Date.now();
      setRates(r);
      setLastUpdated(ts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rates: r, lastUpdated: ts }));
    } catch (e) {
      setError(e?.message || "FX fetch failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /** Convert THB -> selected/display currency */
  const convert = (amountTHB, to = targetCurrency) => {
    const n = Number(amountTHB) || 0;
    if (!to || to === "THB") return n;
    const rate = rates?.[to];
    if (!rate || !isFinite(rate)) return n;
    return n * rate;
  };

  /** Convert from selected/display currency -> THB (for saving in DB) */
  const toBase = (amountInDisplay, from = targetCurrency) => {
    const n = Number(amountInDisplay) || 0;
    if (!from || from === "THB") return n;
    const rate = rates?.[from];
    if (!rate || !isFinite(rate) || rate === 0) return n;
    return n / rate;
  };

  /** Get a short symbol for UI inputs */
  const symbol = (c = targetCurrency) => {
    const map = { THB: "฿", USD: "$", MMK: "MMK" };
    return map[String(c).toUpperCase()] || c;
  };

  const format = (amountTHB, to = targetCurrency, lang = language) =>
    numberFormat(convert(amountTHB, to), to, lang);

  const value = useMemo(
    () => ({
      rates,
      lastUpdated,
      loading,
      error,
      targetCurrency,
      language,
      refreshRates,
      convert,     // THB -> display
      toBase,      // display -> THB ✅ for forms
      format,
      symbol,
    }),
    [rates, lastUpdated, loading, error, targetCurrency, language]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () =>
  useContext(CurrencyContext) || {
    rates: { THB: 1 },
    lastUpdated: 0,
    loading: false,
    error: null,
    targetCurrency: "THB",
    language: "en",
    refreshRates: () => {},
    convert: (x) => x,
    toBase: (x) => x,
    format: (x) => `฿${Number(x).toLocaleString("en")}`,
    symbol: () => "฿",
  };
