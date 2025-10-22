// src/components/users/UserForm.jsx
import React, { useEffect, useState } from "react";

const baseInput =
  "w-full rounded-xl border px-3 py-2 text-sm shadow-sm bg-[var(--surface-1)] " +
  "border-[var(--border-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-emerald)]";

export default function UserForm({ mode = "create", initial, onCancel, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "user",
    is_active: true,
    password: "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name ?? "",
        email: initial.email ?? "",
        role: initial.role ?? "user",
        is_active: initial.is_active ?? true,
        password: "",
      });
    }
  }, [initial]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Name is required");
    if (!form.email.trim()) return alert("Email is required");
    if (mode === "create" && !form.password.trim()) return alert("Password is required");
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm block mb-1">Name</label>
          <input
            className={baseInput}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Email</label>
          <input
            className={baseInput}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Role</label>
          <select className={baseInput} name="role" value={form.role} onChange={handleChange}>
            <option value="user">User</option>
            <option value="engineer">Engineer</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Active
          </label>
        </div>
        {mode === "create" ? (
          <div className="sm:col-span-2">
            <label className="text-sm block mb-1">Password</label>
            <input
              className={baseInput}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Set an initial password"
            />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="text-sm block mb-1">
              Password <span className="text-[var(--muted)]">(leave blank to keep)</span>
            </label>
            <input
              className={baseInput}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="•••••••• (optional)"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-1.5 text-sm border-[var(--border-1)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent-emerald)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-60"
          disabled={loading}
        >
          {mode === "create" ? "Create" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
