// src/components/Topbar.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow flex items-center justify-between px-4">
      <h1 className="font-bold text-xl">Hotel Engineering</h1>

      <div className="flex items-center gap-4">
        {user && <span className="text-gray-600">👤 {user.name}</span>}
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
