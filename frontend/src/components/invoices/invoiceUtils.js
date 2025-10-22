/* ------------------ DATE / TERMS UTILS ------------------ */
export function pad(n) {
  return n < 10 ? `0${n}` : String(n);
}
export function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function parseDate(s) {
  if (!s) return null;
  const mIso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (mIso) {
    const y = +mIso[1], mo = +mIso[2], d = +mIso[3];
    const dt = new Date(y, mo - 1, d);
    return isNaN(dt) ? null : dt;
  }
  return null;
}
export function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
export function addDays(dateStr, days) {
  const d = parseDate(dateStr);
  if (!d) return null;
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return formatDate(x);
}
export function computePastDueDate(terms, deliveryDate) {
  if (!deliveryDate) return null;
  if (terms === "30 Days Net") return addDays(deliveryDate, 30);
  if (terms === "Due on receipt") return deliveryDate;
  return deliveryDate;
}
export function absolutize(u, API_BASE) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return `${API_BASE}/${u.replace(/^\/+/, "")}`;
}
/* ------------------ INVOICE STATUS COUNTS ------------------ */
export function getInvoiceStatusCounts(items = []) {
  const ONE_DAY = 24 * 60 * 60 * 1000;

  function parseISODate(s) {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(y, mo - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function addDaysStr(dateStr, days) {
    const d = parseISODate(dateStr);
    if (!d) return null;
    const x = new Date(d);
    x.setDate(x.getDate() + (Number.isFinite(days) ? days : 0));
    return x;
  }

  function termsToDays(terms) {
    if (!terms) return 30;
    if (typeof terms === "number") return terms;
    if (typeof terms === "object") {
      if (Number.isFinite(terms.termsDays)) return terms.termsDays;
      if (typeof terms.name === "string") return /receipt/i.test(terms.name)
        ? 0
        : 30;
      return 30;
    }
    const s = String(terms);
    if (/receipt/i.test(s)) return 0;
    const m = /(\d+)\s*days/i.exec(s);
    return m ? +m[1] : 30;
  }

  function computeOverdueDays(row) {
    const delivery = row.due_date || row.delivery_date || row.deliveryDate;
    const base = parseISODate(delivery);
    if (!base) return null;
    const days = termsToDays(row.payment_terms || row.terms);
    const dueOn = addDaysStr(delivery, days);
    if (!dueOn) return null;
    const now = new Date();
    const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const b = new Date(dueOn.getFullYear(), dueOn.getMonth(), dueOn.getDate());
    const diff = Math.floor((a - b) / ONE_DAY);
    return Math.max(diff, 0);
  }

  const overdue = items.filter((r) => {
    const status = String(r.status || "").toLowerCase();
    const overdueDays = computeOverdueDays(r);
    return status !== "paid" && overdueDays > 0;
  }).length;

  const posted = items.filter((r) => {
    const status = String(r.status || "").toLowerCase();
    const overdueDays = computeOverdueDays(r);
    return status !== "paid" && overdueDays === 0;
  }).length;

  return {
    postedCount: posted,
    overdueCount: overdue,
    totalCount: overdue + posted,
  };
}
