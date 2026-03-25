
export const localeFromLanguage = (lang = 'en') => {
  const map = { en: 'en-US', th: 'th-TH', my: 'my-MM' };
  return map[lang] || 'en-US';
};

// universal money formatter
export const formatCurrency = (amount, currency = 'THB', language = 'en') => {
  const locale = localeFromLanguage(language);
  const n = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
  } catch {
    // fallback if currency code is unknown to the runtime
    return `${currency} ${n.toLocaleString(locale)}`;
  }
};
