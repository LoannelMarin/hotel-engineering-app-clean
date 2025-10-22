// src/utils/index.js

const ROUTE_MAP = {
  InspectionsDashboard: "/inspections",
  Inspection: "/inspection",
  InspectionSchema: "/inspection/schema",
  Floor: "/inspection/floor",
};

export function createPageUrl(key) {
  if (!key) return "/";
  const [name, query] = String(key).split("?");
  const base = ROUTE_MAP[name] || (name.startsWith("/") ? name : `/${name}`);
  return query ? `${base}?${query}` : base;
}
