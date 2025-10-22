import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { X } from "lucide-react";

const ENDPOINT = "/api/users";

/* -------------------- Normalizador -------------------- */
function normalizeUsers(payload) {
  const arr =
    (payload && (payload.users || payload.items || payload.list)) ||
    (Array.isArray(payload) ? payload : []);
  return (arr || []).map((u, i) => ({
    id: u.id ?? u.user_id ?? u._id ?? i,
    name: u.name ?? u.full_name ?? "",
    email: u.email ?? u.username ?? "",
    role: u.role ?? u.user_role ?? "",
    is_active:
      u.is_active ??
      u.active ??
      (typeof u.enabled === "boolean" ? u.enabled : true),
  }));
}

/* -------------------- Modal Add User -------------------- */
function AddUserModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      alert("Please fill out all required fields.");
      return;
    }

    try {
      setSaving(true);
      await api.post(ENDPOINT, form);
      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error("❌ Error adding user:", err);
      alert("Error adding user. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSave}
        className="w-full max-w-md bg-[var(--surface-1)] text-[var(--text-1)] rounded-2xl shadow-xl border border-[var(--border-1)] p-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-[var(--surface-2)]"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold mb-5">Add New User</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] focus:ring-2 focus:ring-[#0B5150] outline-none"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] focus:ring-2 focus:ring-[#0B5150] outline-none"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Role</label>
            <input
              type="text"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] focus:ring-2 focus:ring-[#0B5150] outline-none"
              placeholder="Admin / Engineer / Guest"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] focus:ring-2 focus:ring-[#0B5150] outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-sm">Active</label>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-5 w-5 accent-[#0B5150]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-white bg-[#0B5150] hover:bg-[#0e6664] disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------- Página principal -------------------- */
export default function Users() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      let res = await api.get(ENDPOINT);
      setUsers(normalizeUsers(res));
    } catch (e1) {
      try {
        let res2 = await api.get(`${ENDPOINT}/`);
        setUsers(normalizeUsers(res2));
      } catch (e2) {
        setErr(e2?.message || e1?.message || "Failed to load users");
        setUsers([]);
        if (e2?.status === 401) navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [users, q]);

  const handleLogout = () => {
    try {
      logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  async function handleDeleteUser(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) return;
    try {
      await api.delete(`${ENDPOINT}/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      alert("❌ Failed to delete user: " + (e?.message || "Unknown error"));
    }
  }

  return (
    <div className="p-2 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-semibold">Users</h1>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, role…"
            className="rounded-2xl border border-gray-300 px-3 py-2 w-full sm:w-[300px] dark:bg-zinc-900 dark:border-zinc-700"
            aria-label="Search users"
          />

          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-2xl border border-gray-300 bg-white hover:shadow disabled:opacity-60 dark:bg-zinc-900 dark:border-zinc-700"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Add User
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white hover:bg-rose-700"
          >
            Logout
          </button>
        </div>
      </header>

      {err && (
        <div className="text-sm text-red-600 border border-red-300 bg-red-50 rounded-xl px-3 py-2">
          {err}
        </div>
      )}

      <div className="overflow-auto rounded-2xl border border-gray-200 dark:border-zinc-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  {loading ? "Loading…" : "No users found"}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                >
                  <td className="px-4 py-3">{u.name || "—"}</td>
                  <td className="px-4 py-3">{u.email || "—"}</td>
                  <td className="px-4 py-3">{u.role || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        u.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="px-3 py-1 text-xs rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddUserModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={load}
      />
    </div>
  );
}
