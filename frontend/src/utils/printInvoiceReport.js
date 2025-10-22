// frontend/src/utils/printInvoiceReport.js
import { computeDueInfo, formatMoney } from "./invoices";

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function computeStats(list) {
  const now = new Date();
  let posted = 0,
    o_1_30 = 0,
    o_31_59 = 0,
    o_60p = 0;

  for (const r of list) {
    const status = String(r.status || "").toLowerCase();
    if (status === "posted") posted++;
    const { isOverdue, daysOverdue } = computeDueInfo(r, now);
    if (isOverdue) {
      if (daysOverdue >= 60) o_60p++;
      else if (daysOverdue >= 31) o_31_59++;
      else if (daysOverdue >= 1) o_1_30++;
    }
  }
  return { posted, o_1_30, o_31_59, o_60p };
}

export function printInvoiceReport(list) {
  const stats = computeStats(list);
  const total = stats.posted + stats.o_1_30 + stats.o_31_59 + stats.o_60p || 1;
  const pct = (n) => Math.round((n / total) * 100);

  const monthStr = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const timeStr = new Date().toLocaleString();

  const grad = `conic-gradient(
    #2563eb 0 ${pct(stats.posted)}%,
    #f59e0b ${pct(stats.posted)}% ${pct(stats.posted + stats.o_1_30)}%,
    #ef4444 ${pct(stats.posted + stats.o_1_30)}% ${pct(stats.posted + stats.o_1_30 + stats.o_31_59)}%,
    #374151 ${pct(stats.posted + stats.o_1_30 + stats.o_31_59)}% 100%
  )`;

  function colorClassFor(r) {
    const status = String(r.status || "").toLowerCase();
    if (status === "posted") return "c-posted";
    const { isOverdue, daysOverdue } = computeDueInfo(r, new Date());
    if (!isOverdue || daysOverdue <= 0) return "c-posted";
    if (daysOverdue >= 60) return "c-60p";
    if (daysOverdue >= 31) return "c-3159";
    return "c-130";
  }

  const rowsHtml = list
    .map((r) => {
      const vendor = r.vendor_name || r.vendor?.name || "-";
      const desc = r.order_description || r.description || r.notes || "-";
      const totalFmt = formatMoney(r.amount, r.currency);
      const order = r.order_date?.slice?.(0, 10) || "-";
      const delivery = r.delivery_date?.slice?.(0, 10) || r.due_date?.slice?.(0, 10) || "-";
      const st = String(r.status || "-");
      const statusLC = String(r.status || "").toLowerCase();
      const daysDue =
        statusLC === "posted" || statusLC === "paid"
          ? 0
          : Math.max(0, computeDueInfo(r, new Date()).daysOverdue || 0);
      const colorCls = colorClassFor(r);

      return `<tr>
        <td>${r.invoice_number || "-"}</td>
        <td>${escapeHtml(vendor)}</td>
        <td>${escapeHtml(desc)}</td>
        <td>${escapeHtml(totalFmt)}</td>
        <td>${escapeHtml(st)}</td>
        <td>${order}</td>
        <td>${delivery}</td>
        <td class="ta-r"><span class="dtdot ${colorCls}"></span>${daysDue}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Engineering invoices - ${monthStr}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; color:#0f172a; margin: 16px; }
  h1 { margin: 0; font-size: 18px; }
  .muted { color:#64748b; font-size: 11px; }
  .header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom: 10px; }
  .donut-wrap { display:flex; align-items:center; gap:12px; }
  .donut { width:100px; height:100px; border-radius:50%; background: ${grad}; position: relative; }
  .donut::after { content:""; position:absolute; inset:16px; background:#ffffff; border-radius:50%; }
  .legend { display:grid; grid-template-columns: auto auto; gap:4px 10px; font-size:11px; }
  .dot { width:9px; height:9px; border-radius:50%; display:inline-block; margin-right:6px; }

  .c-posted { background:#2563eb; }
  .c-130 { background:#f59e0b; }
  .c-3159 { background:#ef4444; }
  .c-60p { background:#374151; }

  .dtdot { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:6px; vertical-align:middle; }

  table { width:100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
  colgroup col:nth-child(1){width:10%}
  colgroup col:nth-child(2){width:14%}
  colgroup col:nth-child(3){width:26%}
  colgroup col:nth-child(4){width:10%}
  colgroup col:nth-child(5){width:10%}
  colgroup col:nth-child(6){width:10%}
  colgroup col:nth-child(7){width:10%}
  colgroup col:nth-child(8){width:10%}

  thead th { text-align:left; background:#e5e7eb; color:#111827; font-weight:700; padding:4px; border:1px solid #374151; font-size:10px; }
  tbody td { padding:4px; border:1px solid #374151; font-size:10px; vertical-align:top; word-break:break-word; }
  .ta-r { text-align:right; }

  @page { margin: 14mm; }
  @media print { body { margin: 0; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Engineering invoices • ${monthStr}</h1>
      <div class="muted">Generated: ${timeStr}</div>
    </div>
    <div class="donut-wrap">
      <div class="donut"></div>
      <div class="legend">
        <div><span class="dot c-posted"></span>Posted</div><div>${stats.posted}</div>
        <div><span class="dot c-130"></span>Overdue 1–30</div><div>${stats.o_1_30}</div>
        <div><span class="dot c-3159"></span>Overdue 31–59</div><div>${stats.o_31_59}</div>
        <div><span class="dot c-60p"></span>Overdue 60+</div><div>${stats.o_60p}</div>
      </div>
    </div>
  </div>

  <table>
    <colgroup>
      <col/><col/><col/><col/><col/><col/><col/><col/>
    </colgroup>
    <thead>
      <tr>
        <th>Invoice #</th>
        <th>Vendor</th>
        <th>Order Description</th>
        <th>Order Total</th>
        <th>Status</th>
        <th>Order Date</th>
        <th>Delivery Date</th>
        <th>Days Overdue</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <script>window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return alert("Popup blocked. Allow popups to print the report.");
  win.document.open();
  win.document.write(html);
  win.document.close();
}
