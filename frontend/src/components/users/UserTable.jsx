// src/components/users/UserTable.jsx
import React from "react";
import { Pencil, Trash2 } from "lucide-react";

export default function UserTable({ items = [], onEdit, onDelete, loading }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--surface-2)]">
          <tr className="text-left">
            <th className="px-3 py-2 font-semibold">Name</th>
            <th className="px-3 py-2 font-semibold">Email</th>
            <th className="px-3 py-2 font-semibold">Role</th>
            <th className="px-3 py-2 font-semibold">Active</th>
            <th className="px-3 py-2 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-[var(--muted)]">
                {loading ? "Loading..." : "No users found"}
              </td>
            </tr>
          )}
          {items.map((u) => (
            <tr key={u.id} className="border-t border-[var(--border-1)]">
              <td className="px-3 py-2">{u.name}</td>
              <td className="px-3 py-2">{u.email}</td>
              <td className="px-3 py-2 uppercase">{u.role}</td>
              <td className="px-3 py-2">{u.is_active ? "Yes" : "No"}</td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit?.(u)}
                    className="rounded-md px-2 py-1 bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete?.(u)}
                    className="rounded-md px-2 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/40"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
