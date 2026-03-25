// Simple, dependency-free helpers for filtering & sorting list items

function parseDateSafe(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d) ? null : d;
}

export function applyFilterSort(items, state, fieldMap) {
  const {
    q = "",
    dateFrom = "",
    dateTo = "",
    category = "",
    minAmount = "",
    maxAmount = "",
    sortBy = "date",
    sortDir = "desc",
  } = state;

  const fm = {
    // map your fields; these match your payloads: { source, category, amount, date }
    date: "date",
    category: "category",
    amount: "amount",
    text: "source",
    ...fieldMap,
  };

  const from = dateFrom ? parseDateSafe(dateFrom) : null;
  const to = dateTo ? parseDateSafe(dateTo) : null;
  const qq = q.trim().toLowerCase();

  let out = (items || []).filter((it) => {
    const dateRaw = it[fm.date] ?? it["createdAt"] ?? it["txnDate"];
    const amtRaw = it[fm.amount] ?? it["value"];
    const catRaw = it[fm.category] ?? it["type"];
    const textRaw =
      it[fm.text] ?? it["title"] ?? it["name"] ?? it["description"] ?? it["note"] ?? "";

    if (qq) {
      const hay =
        String(textRaw).toLowerCase() + " " + String(catRaw ?? "").toLowerCase();
      if (!hay.includes(qq)) return false;
    }

    if (category && String(catRaw) !== String(category)) return false;

    const amt = Number(amtRaw);
    if (minAmount !== "" && !Number.isNaN(Number(minAmount)) && amt < Number(minAmount)) return false;
    if (maxAmount !== "" && !Number.isNaN(Number(maxAmount)) && amt > Number(maxAmount)) return false;

    const d = parseDateSafe(dateRaw);
    if (from && (!d || d < from)) return false;
    if (to && (!d || d > to)) return false;

    return true;
  });

  const dir = sortDir === "asc" ? 1 : -1;
  out.sort((a, b) => {
    const av =
      sortBy === "amount"
        ? Number(a[fm.amount] ?? 0)
        : sortBy === "category"
        ? String(a[fm.category] ?? "")
        : parseDateSafe(a[fm.date] ?? 0)?.getTime() ?? 0;

    const bv =
      sortBy === "amount"
        ? Number(b[fm.amount] ?? 0)
        : sortBy === "category"
        ? String(b[fm.category] ?? "")
        : parseDateSafe(b[fm.date] ?? 0)?.getTime() ?? 0;

    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  return out;
}
