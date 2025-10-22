// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin#2025");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
                 bg-zinc-50 dark:bg-[#121212] text-zinc-800 dark:text-zinc-100 
                 transition-colors duration-300 page-fade-in"
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm sm:max-w-md p-8 rounded-2xl 
                   border border-zinc-200 dark:border-zinc-800 
                   bg-white/70 dark:bg-zinc-900/60 
                   shadow-lg backdrop-blur-sm transition-all"
      >
        <h1 className="text-2xl font-semibold mb-6 text-center text-[#0B5150] dark:text-[rgb(243,255,255)]">
          Sign in
        </h1>

        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1 opacity-80">Email</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 
                         dark:bg-zinc-800 dark:border-zinc-700 
                         focus:ring-2 focus:ring-[#0B5150] dark:focus:ring-[#0B5150] 
                         outline-none transition"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 opacity-80">Password</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 
                         dark:bg-zinc-800 dark:border-zinc-700 
                         focus:ring-2 focus:ring-[#0B5150] dark:focus:ring-[#0B5150] 
                         outline-none transition"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {err && (
            <div className="text-red-600 text-sm mt-1 text-center">{String(err)}</div>
          )}
        </div>

        {/* ✅ Corporate green button */}
        <button
          disabled={loading}
          className="w-full mt-6 px-4 py-2 rounded-2xl font-medium 
                     bg-[#0B5150] hover:bg-[#0d6664] text-black 
                     dark:bg-[#0B5150] dark:hover:bg-[#0d6664] dark:text-white 
                     disabled:opacity-60 transition-all shadow-sm"
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mt-4">
          © {new Date().getFullYear()} Hotel Engineering App
        </p>
      </form>

      <style>{`
        .page-fade-in {
          animation: login-fade .4s ease-out;
        }
        @keyframes login-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
