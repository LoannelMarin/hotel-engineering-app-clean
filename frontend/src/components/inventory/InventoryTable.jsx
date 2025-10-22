// frontend/src/components/inventory/InventoryTable.jsx
import React, { useState, useEffect } from "react";
import { Edit3, Trash2, Minus, Plus, X, Link as LinkIcon } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  window.location.origin.replace(":5173", ":5000");

function resolveImg(src) {
  if (!src) return PLACEHOLDER_DATA_URI;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  return `${API_BASE}/${src.replace(/^\/+/, "")}`;
}

const PLACEHOLDER_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'>
      <rect width='72' height='72' rx='12' fill='#1f2937'/>
      <path d='M22 48l8-10 8 6 10-12 6 7v9H22z' fill='#374151'/>
      <circle cx='28' cy='28' r='6' fill='#374151'/>
    </svg>`
  );

export default function InventoryTable({
  loading,
  items,
  onEditItem,
  onDeleteItem,
  onAdjustInline,
}) {
  const [previewImg, setPreviewImg] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vendors`);
        const data = await res.json();
        setVendors(data.items || []);
      } catch (err) {
        console.error("Error loading vendors:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && setPreviewImg(null);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function handleSort(key) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        return { key, direction: nextDir };
      }
      return { key, direction: "asc" };
    });
  }

  const sortedItems = React.useMemo(() => {
    if (!sortConfig.key) return items;
    return [...items].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [items, sortConfig]);

  const TD = "px-4 sm:px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800";

  return (
    <>
      <div className="relative w-full h-full overflow-x-auto overflow-y-auto rounded-2xl">
        <table className="w-full text-[15px] leading-6 border-separate [border-spacing:0] select-none">
          {/* HEADER */}
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800">
            <tr>
              {[
                { label: "Image", key: null, align: "center" },
                { label: "Name", key: "name" },
                { label: "Location", key: "location" },
                { label: "Part No", key: "part_no" },
                { label: "Stock", key: "stock", align: "center" },
                { label: "Minimum", key: "minimum", align: "center" },
                { label: "Description", key: "description" },
                { label: "Supplier", key: "supplier" },
                { label: "Product Link", key: "product_link", align: "center" },
                { label: "Item ID", key: "item_id" },
                { label: "Actions", key: null, align: "center" },
              ].map((col) => {
                const isSorted = sortConfig.key === col.key;
                const dirIcon =
                  isSorted && sortConfig.direction === "asc"
                    ? "▲"
                    : isSorted
                    ? "▼"
                    : "";
                return (
                  <th
                    key={col.label}
                    onClick={() => col.key && handleSort(col.key)}
                    className={[
                      "px-4 sm:px-5 py-3 font-semibold text-zinc-700 dark:text-zinc-200 select-none",
                      col.key ? "cursor-pointer" : "",
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left",
                    ].join(" ")}
                  >
                    <div
                      className={`flex ${
                        col.align === "center"
                          ? "justify-center"
                          : col.align === "right"
                          ? "justify-end"
                          : "justify-between"
                      } items-center gap-1`}
                    >
                      <span>{col.label}</span>
                      {dirIcon && <span className="text-xs opacity-60">{dirIcon}</span>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 sm:px-5 py-6 text-center text-zinc-600 dark:text-zinc-400"
                >
                  Loading…
                </td>
              </tr>
            ) : sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 sm:px-5 py-6 text-center text-zinc-600 dark:text-zinc-400"
                >
                  No items to display.
                </td>
              </tr>
            ) : (
              sortedItems.map((it, idx, arr) => {
                const img = resolveImg(it.image || it.image_url);
                const vendor = vendors.find((v) => v.id === it.supplier_id);
                const isLast = idx === arr.length - 1;

                return (
                  <tr
                    key={it.id}
                    className={`text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition ${
                      isLast ? "last:[&>td]:border-b-0" : ""
                    }`}
                  >
                    <td className={TD + " text-center"}>
                      <img
                        src={img}
                        alt={it.name || "Item"}
                        className="h-16 w-16 object-cover rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-900/40 mx-auto cursor-zoom-in hover:scale-[1.05] transition-transform"
                        onClick={() => setPreviewImg(img)}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_DATA_URI)}
                      />
                    </td>

                    <td className={TD + " font-semibold"}>{it.name || "-"}</td>
                    <td className={TD}>{it.location || "-"}</td>
                    <td className={TD}>{it.part_no || "-"}</td>

                    <td className={TD + " text-center"}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="p-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => onAdjustInline?.(it, -1)}
                        >
                          <Minus size={15} />
                        </button>
                        <span className="tabular-nums min-w-[36px] text-center">
                          {it.stock ?? 0}
                        </span>
                        <button
                          type="button"
                          className="p-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => onAdjustInline?.(it, +1)}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </td>

                    <td className={TD + " text-center tabular-nums"}>
                      {it.minimum ?? 0}
                    </td>

                    <td className={TD + " max-w-[360px] truncate"} title={it.description}>
                      {it.description || "-"}
                    </td>

                    <td className={TD}>
                      {vendor ? (
                        <div className="flex items-center gap-2">
                          {vendor.logo_url && (
                            <img
                              src={resolveImg(vendor.logo_url)}
                              alt={vendor.name}
                              className="w-6 h-6 rounded object-cover border border-zinc-700"
                            />
                          )}
                          <span>{vendor.name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className={TD + " text-center"}>
                      {it.product_link ? (
                        <a
                          href={it.product_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#0B5150]/50 text-[#0B5150] hover:bg-[#0B5150]/10 dark:text-[#5ad5d3] dark:border-[#0B5150]/60 dark:hover:bg-[#0B5150]/20"
                        >
                          <LinkIcon size={14} />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className={TD}>{it.item_id || "-"}</td>

                    <td className={TD + " text-center"}>
                      <div className="inline-flex justify-center gap-2 flex-wrap">
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => onEditItem?.(it)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg border border-rose-700 text-rose-700 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                          onClick={() => onDeleteItem?.(it)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PREVIEW MODAL */}
      {previewImg && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImg(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute -top-3 -right-3 bg-zinc-900/80 text-white p-1.5 rounded-full hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImg}
              alt="Preview"
              className="rounded-2xl max-h-[90vh] object-contain shadow-2xl border border-zinc-700/50"
            />
          </div>
        </div>
      )}
    </>
  );
}
