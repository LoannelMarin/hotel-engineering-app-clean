// frontend/src/components/dashboard/InventorySummaryCard.jsx
import React, { useEffect, useState } from "react";
import { PackageX, ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../utils/api";
import { motion } from "framer-motion";

export default function InventorySummaryCard() {
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [topUsed, setTopUsed] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadInventoryData() {
      try {
        setLoading(true);

        // 1️⃣ Cargar items de inventario
        const invData = await fetchWithAuth("/api/inventory/?per_page=1000");
        const items = invData.items || invData || [];

        const itemMap = {};
        items.forEach((it) => {
          if (it.item_id || it.name) itemMap[it.item_id] = it.name;
        });

        // 2️⃣ Calcular los que están out of stock
        const outCount = items.filter(
          (it) => Number(it.stock ?? 0) <= Number(it.minimum ?? 0)
        ).length;
        setOutOfStockCount(outCount);

        // 3️⃣ Cargar logs (movimientos de stock)
        const logsData = await fetchWithAuth("/api/inventory/logs?per_page=1000");
        const logs = logsData.items || logsData || [];

        // 4️⃣ Calcular los más usados (delta < 0)
        const usage = {};
        logs.forEach((log) => {
          const qty = Number(log.delta || 0);
          const code = log.item_code || log.item_id || "Unknown";

          if (qty < 0 && code) {
            const itemName = itemMap[code] || code;
            usage[itemName] = (usage[itemName] || 0) + Math.abs(qty);
          }
        });

        const sorted = Object.entries(usage)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, total]) => ({ name, total }));

        setTopUsed(sorted);
      } catch (err) {
        console.error("❌ Error loading inventory summary:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInventoryData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="
        col-span-1
        rounded-2xl
        bg-white dark:bg-[#1d1f24]
        ring-1 ring-zinc-100 dark:ring-zinc-800
        shadow-[0_10px_30px_rgba(2,6,23,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]
        hover:shadow-[0_14px_36px_rgba(2,6,23,0.10)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)]
        transition-all duration-300
        p-6 flex flex-col justify-between
        h-full min-h-[360px]
      "
    >
      <div>
        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#0B5150] dark:text-white">
            Inventory Summary
          </h3>
          <button
            onClick={() => navigate("/inventory")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg 
                       bg-[#0B5150] hover:bg-[#094241] text-white text-sm transition"
          >
            Go to Inventory <ArrowRight size={14} />
          </button>
        </div>

        {/* ---------- Content ---------- */}
        {loading ? (
          <p className="text-sm text-zinc-400">Loading inventory data…</p>
        ) : (
          <>
            {/* 🔴 Items out of stock */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40">
                <PackageX className="text-red-600 dark:text-red-400" size={28} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Items Out of Stock
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {outOfStockCount}
                </p>
              </div>
            </motion.div>

            {/* 📦 Top 3 más usados */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                <TrendingUp size={16} /> Top 3 Most Used
              </p>

              {topUsed.length > 0 ? (
                <ul className="space-y-1">
                  {topUsed.map((t, i) => (
                    <li
                      key={i}
                      className="flex justify-between text-sm border-b border-zinc-100 dark:border-zinc-800 pb-1"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                        {t.name}
                      </span>
                      <span className="font-semibold text-[#0B5150] dark:text-[#5ad5d3]">
                        {t.total}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-400">
                  No usage data available
                </p>
              )}
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
