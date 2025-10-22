import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAuth } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      if (token) {
        try {
          const me = await api.get("/api/auth/me");
          if (me?.id) {
            setAuth({ user_id: me.id });
            setUser(me);
          }
        } catch {
          logout();
        }
      }
      setReady(true);
    })();
  }, []);

  async function login(email, password) {
    const res = await api.post("/api/auth/login", { email, password });
    const token = res?.access_token || res?.token || res?.accessToken;
    if (!token) throw new Error("Login sin token");

    localStorage.setItem("access_token", token);

    const me = await api.get("/api/auth/me");
    if (me?.id) {
      setAuth({ access_token: token, user_id: me.id });
      setUser(me);
    }
    return true;
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user_id");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
