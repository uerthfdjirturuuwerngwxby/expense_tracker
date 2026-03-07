import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
// No API prefix – all requests go through the Vite proxy
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function useAuth() {
  const location = useLocation();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const checkAuth = async () => {
    try {
      const data = await apiFetch("/api/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, [location.pathname]);

  const signup = useCallback(async ({ first_name, last_name, email, password }) => {
    const data = await apiFetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({ first_name, last_name, email, password }),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    return data.user;
  }, []);

const refreshUser = useCallback(async () => {
  try {
    const data = await apiFetch("/api/me");
    setUser(data.user);
    return data.user;
  } catch {
    setUser(null);
    return null;
  }
}, []);

const loginWithGoogle = useCallback(async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:5173/auth/callback",
    },
  });
}, []);

  const logout = useCallback(async () => {
    const email = (user?.email || "").toLowerCase();
    if (email === "samalanithin18@gmail.com") {
      localStorage.removeItem("expenseai:test:monthlyRows:v1");
      localStorage.removeItem("expenseai:test:dailyExpenses:v1");
      localStorage.removeItem("expenseai:budget");
    }
    await apiFetch("/api/logout", { method: "POST" });
    setUser(null);
  }, [user]);

return { user, loading, signup, login, loginWithGoogle, logout,refreshUser  };

}
