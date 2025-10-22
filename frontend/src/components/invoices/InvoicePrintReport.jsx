// Build HTML for the printable report (no React rendering needed).
// Usage (from InvoiceTracker): const html = buildInvoiceReportHTML(filtered, vendorMap);

export function buildInvoiceReportHTML(items = [], vendorMap = {}) {
  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" });
  const headerTitle = `Engineering • Invoice Tracker — ${monthName} ${now.getFullYear()}`;
  const printedAt = `${fmtDateTime(now)}`;

  // ✅ ORDEN: de mayor a menor Days Due (sin tocar nada más)
  const sortedItems = [...items].sort((a, b) => computeDaysDue(b) - computeDaysDue(a));

  const rowsHtml = sortedItems
    .map((r, idx) => {
      const vendor =
        vendorMap[String(r.vendor_id)] ||
        r.vendor?.name ||
        r.vendor?.company ||
        r.vendor ||
        "";

      const days = computeDaysDue(r);
      const status = deriveStatus(r, days);
      const statusBadge = statusBadgeHtml(status);
      const zebra = idx % 2 ? "row alt" : "row";

      return `
        <tr class="${zebra}">
          <td class="td text">${safe(r.invoice_number || "—")}</td>
          <td class="td text">${safe(vendor || "—")}</td>
          <td class="td text">${safe(r.order_description || r.description || r.notes || "—")}</td>
          <td class="td text">${fmtDate(r.order_date)}</td>
          <td class="td text">${fmtDate(r.delivery_date || r.due_date)}</td>
          <td class="td">${statusBadge}</td>
          <td class="td num">${days}</td>
          <td class="td money">${fmtMoney(r.amount, r.currency)}</td>
          <td class="td chk"><span class="checkbox"></span></td>
        </tr>`;
    })
    .join("");

  const total = sumAmount(items);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice report</title>
<style>
  :root{
    --ink:#0b1220; --muted:#475569; --line:#555; /* 👈 más oscuro para todas las líneas */
    --bg:#FFFFFF; --bg-alt:#F8FAFC;
    --pill-posted:#EEF2FF; --pill-posted-b:#C7D2FE; --pill-posted-t:#3730A3;
    --pill-paid:#ECFDF5; --pill-paid-b:#A7F3D0; --pill-paid-t:#065F46;
    --pill-od:#FEF2F2; --pill-od-b:#FECACA; --pill-od-t:#991B1B;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --ink:#E5E7EB; --muted:#94A3B8; --line:#777; /* 👈 más oscuro en dark también */
      --bg:#0B0F14; --bg-alt:#0F141B;
      --pill-posted:#111827; --pill-posted-b:#334155; --pill-posted-t:#93C5FD;
      --pill-paid:#052B27; --pill-paid-b:#0F766E; --pill-paid-t:#34D399;
      --pill-od:#2B0B0B; --pill-od-b:#7F1D1D; --pill-od-t:#FCA5A5;
    }
  }
  *{box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact}
  body{margin:12px; font:12px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial; color:var(--ink); background:var(--bg)}
  h1{margin:0 0 4px 0; font-size:18px; font-weight:700}
  .sub{color:#fff; font-size:11px}

  /* === Header azul degradado === */
  .header{
    display:flex; justify-content:space-between; align-items:flex-end;
    padding:10px 14px; border:1px solid transparent; border-radius:12px;
    background: linear-gradient(135deg, #0B66C3, #4FB3FF);
    color:#fff; margin-bottom:12px;
    box-shadow: 0 6px 18px rgba(11,102,195,0.25);
  }
  .header h1, .header .sub { color:#fff !important; }

  table{width:100%; border-collapse:collapse; border-radius:12px; overflow:hidden; border:1px solid var(--line)}
  thead th{
    text-align:left; font-weight:700; padding:6px 8px; background:var(--bg-alt);
    border-bottom:1px solid var(--line); font-size:11px;
  }
  .row td{padding:4px 7px; border-bottom:1px solid var(--line); line-height:1.2; font-size:11px}
  .row.alt td{background:rgba(99,102,241,0.025)}
  .td.money{text-align:left; white-space:nowrap}
  .td.num{text-align:left}
  .td.text{max-width:360px}

  th.chk, td.chk { width:22px; text-align:center; white-space:nowrap; }
  .checkbox{
    display:inline-block; width:12px; height:12px;
    border:1px solid #333; border-radius:3px; vertical-align:middle;
    background:#fff;
  }

  tfoot td{padding:6px 8px; font-weight:700; border-top:1px solid var(--line);} /* 👈 igual que las demás */
  .total-cell { text-align:left; font-weight:700; }

  .pill{
    display:inline-block; padding:2px 8px; border-radius:9999px; border:1px solid;
    font-size:11px; font-weight:600
  }
  .posted{background:var(--pill-posted); color:var(--pill-posted-t); border-color:var(--pill-posted-b)}
  .paid{background:var(--pill-paid); color:var(--pill-paid-t); border-color:var(--pill-paid-b)}
  .overdue{background:var(--pill-od); color:var(--pill-od-t); border-color:var(--pill-od-b)}
  .gap{height:8px}

  @media print{
    body{margin:6mm;}
    .header{box-shadow:none;}
    thead {display: table-header-group;}
    tfoot {display: table-row-group;} /* ✅ no repetir footer en cada página; aparece solo al final */
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${safe(headerTitle)}</h1>
      <div class="sub">Printed: ${safe(printedAt)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Invoice #</th>
        <th>Vendor</th>
        <th>Order Description</th>
        <th>Order Date</th>
        <th>Delivery Date</th>
        <th>Status</th>
        <th>Days Due</th>
        <th>Order Total</th>
        <th class="chk"></th>
      </tr>
    </thead>
    <tbody>
      ${
        rowsHtml ||
        `<tr class="row"><td class="td" colspan="9" style="color:var(--muted)">No results.</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr>
        <td colspan="7"></td>
        <td class="total-cell">
          ${fmtMoney(total)}
        </td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <script>window.print()</script>
</body>
</html>`;
}

/* ---------- helpers ---------- */
function safe(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function fmtMoney(amount, currency = "USD") {
  const n =
    typeof amount === "number"
      ? amount
      : amount == null
      ? 0
      : Number.parseFloat(String(amount).replace(/[^0-9.-]/g, ""));
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencySign: "accounting",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
  }
}
function fmtDate(s) {
  if (!s) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  if (!m) return safe(s);
  return `${m[1]}-${m[2]}-${m[3]}`;
}
function fmtDateTime(d) {
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

/* ----- date math matching the app ----- */
function parseISO(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
function addDays(baseDateStr, days) {
  const d = parseISO(baseDateStr);
  if (!d) return null;
  const x = new Date(d);
  x.setDate(x.getDate() + (days || 0));
  return x;
}
function computeDaysDue(r) {
  const baseStr = r.delivery_date || r.due_date || null;
  const terms = (r.payment_terms || r.terms || "30 Days Net").toLowerCase();
  if (!baseStr) return 0;

  const pastDueOn =
    terms.includes("30") || terms.includes("net")
      ? addDays(baseStr, 30)
      : addDays(baseStr, 0);

  if (!pastDueOn) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ms = today.getTime() - pastDueOn.getTime();
  const days = Math.floor(ms / 86400000);
  return days > 0 ? days : 0;
}
function deriveStatus(r, daysDue) {
  const raw = String(r.status || "").toLowerCase();
  if (raw === "paid") return "Paid";
  if (daysDue > 0) return "Overdue";
  return r.status || "Posted";
}
function statusBadgeHtml(status) {
  const cls =
    status === "Paid" ? "paid" : status === "Overdue" ? "overdue" : "posted";
  return `<span class="pill ${cls}">${safe(status)}</span>`;
}
function sumAmount(items) {
  return items.reduce((acc, r) => {
    const n =
      typeof r.amount === "number"
        ? r.amount
        : r.amount == null
        ? 0
        : Number.parseFloat(String(r.amount).replace(/[^0-9.-]/g, ""));
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}
