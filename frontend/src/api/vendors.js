// frontend/src/api/vendors.js
import api from "./client";

// Siempre bajo el prefijo /api
const BASE = "/api/vendors";

export const list = () => api.get(BASE);                   // GET /api/vendors
export const create = (data) => api.post(BASE, data);      // POST /api/vendors
export const update = (id, data) => api.put(`${BASE}/${id}`, data); // PUT /api/vendors/:id
export const remove = (id) => api.delete(`${BASE}/${id}`);          // DELETE /api/vendors/:id
