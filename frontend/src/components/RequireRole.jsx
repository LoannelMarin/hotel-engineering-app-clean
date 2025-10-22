// src/components/RequireRole.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Uso: <RequireRole roles={['admin']}><Componente/></RequireRole>
export default function RequireRole({ roles = [], children }) {
  const { hydrated, token, user, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!hydrated) return null; // o spinner

  // Si no está autenticado, manda a login
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si no tiene el rol requerido, envía a una página de "sin acceso"
  if (roles.length && !hasAnyRole(roles)) {
    return <Navigate to="/login" replace state={{ from: location, reason: "forbidden" }} />;
    // o a "/403" si tienes una página dedicada
  }

  return children;
}
