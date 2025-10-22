// frontend/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/** Decodifica un JWT sin verificar firma y devuelve el payload (o null) */
function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Devuelve true solo si el token existe y NO está expirado (requiere exp) */
function isTokenValid(token) {
  if (!token) return false;
  const p = decodeJwt(token);
  // Si no hay exp, consideramos inválido para obligar login
  if (!p || typeof p.exp !== "number") return false;
  const now = Math.floor(Date.now() / 1000);
  return p.exp > now;
}

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  // Si no hay token o está vencido, limpiamos y mandamos a /login
  if (!isTokenValid(token)) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user_id");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
