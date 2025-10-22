// frontend/src/utils/invoices.js

/* ---------- formato contable USD (con fallback a otras monedas) ---------- */
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  currencySign: "accounting",
  maximumFractionDigits: 2,
});

export function formatMoney(amount, currencyCode = "USD") {
  const n =
    typeof amount === "number"
      ? amount
      : amount == null
      ? NaN
      : Number.parseFloat(String(amount).replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n)) return "-";
  if (currencyCode && currencyCode !== "USD") {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        currencySign: "accounting",
        maximumFractionDigits: 2,
      }).format(n);
    } catch {
      return usdFormatter.format(n);
    }
  }
  return usdFormatter.format(n);
}

/* ---------- utils de fecha / overdue ---------- */
function toDate(isoLike) {
  if (!isoLike) return null;
  const s = String(isoLike);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function diffDays(a, b) {
  const A = startOfDay(a).getTime();
  const B = startOfDay(b).getTime();
  return Math.floor((A - B) / (24 * 60 * 60 * 1000));
}

/**
 * Calcula vencimiento según payment_terms:
 * - **Due on receipt**: due = (delivery || due || post || order || created)
 * - **30 Days Net**:    due = (delivery || due || post || order || created) + 30
 */
export function computeDueInfo(row, now = new Date()) {
  const terms = (row.payment_terms || row.terms || "30 Days Net").toLowerCase();

  const delivery = toDate(row.delivery_date);
  const due = toDate(row.due_date); // <- aquí estaba el typo
  const post = toDate(row.post_date);
  const order = toDate(row.order_date);
  const created = toDate(row.created_at);

  function pickRef(...ds) {
    for (const d of ds) if (d) return d;
    return null;
  }

  let dueDate = null;
  if (terms.includes("due on receipt") || terms.includes("due upon receipt")) {
    dueDate = pickRef(delivery, due, post, order, created);
  } else {
    const ref = pickRef(delivery, due, post, order, created);
    if (ref) dueDate = addDays(ref, 30);
  }

  if (!dueDate) return { dueDate: null, daysOverdue: 0, isOverdue: false };

  const daysOverdue = diffDays(new Date(now), dueDate);
  return { dueDate, daysOverdue, isOverdue: daysOverdue > 0 };
}

export function getDaysDue(row) {
  const status = String(row.status || "").toLowerCase();
  if (status === "posted" || status === "paid") return 0;
  const { daysOverdue } = computeDueInfo(row, new Date());
  return Math.max(0, daysOverdue || 0);
}
