import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * VendorSelect / TermsSelect
 * - Compacto, reutilizable, coherente con estilo Loannel.
 * - Soporta búsqueda, hover, selección con teclado y dark mode.
 */
export default function VendorSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);

  const items = useMemo(
    () =>
      options.map((v) => ({
        value: String(v.id),
        label: v.name || v.vendor_name || v.title || String(v.id),
      })),
    [options]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        String(it.value).toLowerCase().includes(q)
    );
  }, [items, query]);

  const selected = items.find((i) => i.value === String(value));

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
      setHighlight(filtered.length ? 0 : -1);
    } else {
      setQuery("");
      setHighlight(-1);
    }
  }, [open, filtered.length]);

  function toggle() {
    setOpen((o) => !o);
  }
  function choose(v) {
    onChange?.(v);
    setOpen(false);
  }

  function onKeyDownButton(e) {
    if (!open && ["ArrowDown", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onKeyDownSearch(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown")
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    if (e.key === "ArrowUp") setHighlight((h) => Math.max(h - 1, 0));
    if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[highlight];
      if (it) choose(it.value);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        onKeyDown={onKeyDownButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-slate-800 dark:text-slate-100"
      >
        <span className={selected ? "" : "text-slate-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 text-slate-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#0F141B]">
          {/* Barra de búsqueda */}
          <div className="sticky top-0 border-b border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-[#0F141B]">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDownSearch}
              placeholder="Type to filter…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-[#0B1118] dark:text-slate-100"
            />
          </div>

          {/* Lista filtrada */}
          <ul className="max-h-60 overflow-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                No matches
              </li>
            )}
            {filtered.map((it, idx) => {
              const active = highlight === idx;
              const isSelected = String(value) === it.value;
              return (
                <li key={it.value} className="rounded-md">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => choose(it.value)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-indigo-50 text-slate-900 dark:bg-indigo-600/30 dark:text-white"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-indigo-600/20"
                    }`}
                  >
                    <span className="truncate">{it.label}</span>
                    {isSelected && (
                      <Check className="ml-2 h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
