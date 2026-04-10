import { useEffect, useMemo, useState, useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { applyFilterSort } from "../../utils/filtering";
import { LuFilter, LuSearch, LuX, LuRotateCcw } from "react-icons/lu";

export default function FilterControl({
  items = [],
  onChange = () => {},
  fieldMap = { date: "date", category: "category", amount: "amount", text: "source" },
  categories,
  label = "Filter",
  theme = "default",
}) {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({
    q: "",
    dateFrom: "",
    dateTo: "",
    category: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "date",
    sortDir: "desc",
  });

  const derivedCats = useMemo(() => {
    if (categories?.length) return categories;
    const s = new Set((items || []).map((it) => String(it[fieldMap.category] ?? it.type ?? "")));
    s.delete("");
    return Array.from(s).sort();
  }, [items, categories, fieldMap.category]);

  const applyNow = () => {
    const filtered = applyFilterSort(items, state, fieldMap);
    onChange(filtered, state);
    setOpen(false);
  };

  const resetAll = () => {
    const fresh = {
      q: "",
      dateFrom: "",
      dateTo: "",
      category: "",
      minAmount: "",
      maxAmount: "",
      sortBy: "date",
      sortDir: "desc",
    };
    setState(fresh);
    const filtered = applyFilterSort(items, fresh, fieldMap);
    onChange(filtered, fresh);
  };

  useEffect(() => {
    const filtered = applyFilterSort(items, state, fieldMap);
    onChange(filtered, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const isNeon = theme === "neon";
  const buttonClass = isNeon
    ? "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[#d0d3e4] hover:bg-white/[0.05]"
    : "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5";
  const panelClass = isNeon
    ? "absolute right-0 z-[60] mt-2 w-[360px] rounded-[24px] border border-white/10 bg-[#11131b] p-5 text-white shadow-2xl"
    : "absolute right-0 mt-2 w-[340px] rounded-2xl border bg-white p-4 shadow-xl ring-1 ring-black/5 dark:bg-neutral-900 dark:text-white z-[60]";
  const fieldClass = isNeon
    ? "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white outline-none"
    : "w-full rounded-xl border px-3 py-2 bg-transparent";
  const searchWrapClass = isNeon
    ? "mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
    : "mb-4 flex items-center gap-2 rounded-xl border px-3 py-2";
  const subtleText = isNeon ? "text-[#7b8095]" : "opacity-70";
  const secondaryButtonClass = isNeon
    ? "rounded-2xl border border-white/10 px-3 py-2 text-sm text-[#d0d3e4] hover:bg-white/[0.05]"
    : "rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5";
  const applyButtonClass = isNeon
    ? isDark 
      ? "rounded-2xl bg-[#d9ff34] px-4 py-2 text-sm font-bold text-black hover:bg-[#cbf029]"
      : "rounded-2xl bg-[#84cc16] px-4 py-2 text-sm font-bold text-white hover:bg-[#65a30d]"
    : "rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700";
  const activeSortButtonClass = isNeon ? "bg-white/[0.08] text-white" : "bg-black/5 dark:bg-white/10";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
      >
        <LuFilter className="opacity-80" />
        {label}
      </button>

      {open && (
        <div
          className={panelClass}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium">Search, Filter & Sort</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={isNeon ? "rounded-xl p-1.5 hover:bg-white/[0.05]" : "rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10"}
              aria-label="Close"
            >
              <LuX />
            </button>
          </div>

          <label className={`mb-2 block text-xs font-medium ${subtleText}`}>Search</label>
          <div className={searchWrapClass}>
            <LuSearch className="opacity-60" />
            <input
              value={state.q}
              onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
              placeholder="title/source or category…"
              className="w-full bg-transparent outline-none"
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block text-xs font-medium ${subtleText}`}>From</label>
              <input
                type="date"
                value={state.dateFrom}
                onChange={(e) => setState((s) => ({ ...s, dateFrom: e.target.value }))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium ${subtleText}`}>To</label>
              <input
                type="date"
                value={state.dateTo}
                onChange={(e) => setState((s) => ({ ...s, dateTo: e.target.value }))}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={`mb-1 block text-xs font-medium ${subtleText}`}>Category</label>
            <select
              value={state.category}
              onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
              className={fieldClass}
            >
              <option value="">All</option>
              {derivedCats.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block text-xs font-medium ${subtleText}`}>Min Amount</label>
              <input
                type="number"
                inputMode="decimal"
                value={state.minAmount}
                onChange={(e) => setState((s) => ({ ...s, minAmount: e.target.value }))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium ${subtleText}`}>Max Amount</label>
              <input
                type="number"
                inputMode="decimal"
                value={state.maxAmount}
                onChange={(e) => setState((s) => ({ ...s, maxAmount: e.target.value }))}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block text-xs font-medium ${subtleText}`}>Sort by</label>
              <select
                value={state.sortBy}
                onChange={(e) => setState((s) => ({ ...s, sortBy: e.target.value }))}
                className={fieldClass}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium ${subtleText}`}>Direction</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, sortDir: "asc" }))}
                  className={`flex-1 rounded-xl border px-3 py-2 inline-flex items-center justify-center gap-2 ${state.sortDir === "asc" ? activeSortButtonClass : ""}`}
                >
                  ▲ Asc
                </button>
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, sortDir: "desc" }))}
                  className={`flex-1 rounded-xl border px-3 py-2 inline-flex items-center justify-center gap-2 ${state.sortDir === "desc" ? activeSortButtonClass : ""}`}
                >
                  ▼ Desc
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetAll}
              className={secondaryButtonClass}
            >
              <LuRotateCcw /> Reset
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyNow}
                className={applyButtonClass}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
