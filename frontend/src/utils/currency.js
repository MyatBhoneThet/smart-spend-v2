
export const localeFromLanguage = (lang = 'en') => {
  const map = { en: 'en-US', th: 'th-TH', my: 'my-MM' };
  return map[lang] || 'en-US';
};

const ZERO_DECIMAL_CURRENCIES = new Set(['MMK', 'JPY', 'KRW', 'VND']);

// universal money formatter
export const formatCurrency = (amount, currency = 'THB', language = 'en') => {
  const locale = localeFromLanguage(language);
  const n = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
      maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
    }).format(n);
  } catch {
    // fallback if currency code is unknown to the runtime
    const value = ZERO_DECIMAL_CURRENCIES.has(currency) ? Math.round(n) : n;
    return `${currency} ${value.toLocaleString(locale)}`;
  }
};
