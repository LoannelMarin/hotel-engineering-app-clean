// src/api/inspections.js
import { fetchWithAuth } from "../utils/api";

/* ---------- HUB ---------- */
export async function listScopes() {
  return fetchWithAuth("/api/inspections/scopes");
}

export async function listInspections({ status = "all" } = {}) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchWithAuth(`/api/inspections${qs}`);
}

/* ---------- CRUD inspection ---------- */
export async function createInspection(payload) {
  return fetchWithAuth("/api/inspections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getInspection(id) {
  return fetchWithAuth(`/api/inspections/${id}`);
}

export async function updateInspection(id, patch) {
  return fetchWithAuth(`/api/inspections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function completeInspection(id) {
  return fetchWithAuth(`/api/inspections/${id}/complete`, { method: "POST" });
}

/* ---------- Items ---------- */
export async function listItems(inspectionId) {
  return fetchWithAuth(`/api/inspections/${inspectionId}/items`);
}

export async function updateItemStatus(inspectionId, itemId, { status, notes }) {
  return fetchWithAuth(`/api/inspections/${inspectionId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, notes }),
  });
}

export async function addItemComment(inspectionId, { item_id, note }) {
  return fetchWithAuth(
    `/api/inspections/${inspectionId}/items/${item_id}/comment`,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    }
  );
}

/** 
 * 🔹 Sube el archivo a /api/uploads y luego registra la URL en el item.
 * - Primero POST multipart con FormData.
 * - Luego POST JSON con {url} al item.
 */
export async function uploadItemPhoto(inspectionId, itemId, fileObj) {
  // 1) Subir el archivo
  const fd = new FormData();
  fd.append("file", fileObj);

  const uploadRes = await fetch(
    (import.meta.env.VITE_API_BASE_URL ||
      window.location.origin.replace(":5173", ":5000")) + "/api/uploads",
    {
      method: "POST",
      body: fd,
      credentials: "include",
    }
  );

  if (!uploadRes.ok) {
    let errMsg = "Upload failed";
    try {
      const errJson = await uploadRes.json();
      if (errJson?.error) errMsg = errJson.error;
    } catch {}
    throw new Error(errMsg);
  }

  const uploaded = await uploadRes.json();
  const url = uploaded?.url || uploaded?.path || uploaded?.file_url;
  if (!url) throw new Error("Upload did not return a valid URL");

  // 2) Registrar la foto en el item
  return fetchWithAuth(
    `/api/inspections/${inspectionId}/items/${itemId}/photos`,
    {
      method: "POST",
      body: JSON.stringify({ url }),
    }
  );
}
