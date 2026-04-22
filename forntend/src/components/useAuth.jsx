import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";

// No API prefix - all requests go through the Vite proxy.
export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/auth/callback"]);
const listeners = new Set();
let sharedAuthState = {
  user: null,
  loading: true,
};

function broadcastAuthState(next) {
  sharedAuthState = { ...sharedAuthState, ...next };
  for (const listener of listeners) listener(sharedAuthState);
}

function hasVisibleSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim().startsWith("auth_token_info="));
}

async function syncUserFromServer() {
  const data = await apiFetch("/api/me");
  broadcastAuthState({ user: data.user, loading: false });
  return data.user;
}

export function useAuth() {
  const location = useLocation();
  const [user, setUser] = useState(sharedAuthState.user);
  const [loading, setLoading] = useState(sharedAuthState.loading);

  useEffect(() => {
    const listener = (next) => {
      setUser(next.user);
      setLoading(next.loading);
    };
    listeners.add(listener);
    listener(sharedAuthState);
    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const isPublicPath = PUBLIC_PATHS.has(location.pathname);
      if (isPublicPath && !hasVisibleSessionCookie()) {
        broadcastAuthState({ user: null, loading: false });
        return;
      }

      broadcastAuthState({ loading: true });
      try {
        await syncUserFromServer();
      } catch {
        broadcastAuthState({ user: null, loading: false });
      }
    };

    checkAuth();
  }, [location.pathname]);

  const signup = useCallback(async ({ first_name, last_name, email, password }) => {
    broadcastAuthState({ loading: true });
    const data = await apiFetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({ first_name, last_name, email, password }),
    });
    try {
      return await syncUserFromServer();
    } catch {
      broadcastAuthState({ user: data.user, loading: false });
      return data.user;
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    broadcastAuthState({ loading: true });
    const data = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    try {
      return await syncUserFromServer();
    } catch {
      broadcastAuthState({ user: data.user, loading: false });
      return data.user;
    }
  }, []);

  const requestPasswordResetOtp = useCallback(async ({ email }) => {
    return apiFetch("/api/forgot-password/request-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }, []);

  const resendPasswordResetOtp = useCallback(async ({ email }) => {
    return apiFetch("/api/forgot-password/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }, []);

  const verifyPasswordResetOtp = useCallback(async ({ email, otp }) => {
    return apiFetch("/api/forgot-password/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  }, []);

  const resetPasswordWithOtp = useCallback(async ({ email, password }) => {
    return apiFetch("/api/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }, []);

  const refreshUser = useCallback(async () => {
    broadcastAuthState({ loading: true });
    try {
      return await syncUserFromServer();
    } catch {
      broadcastAuthState({ user: null, loading: false });
      return null;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
    broadcastAuthState({ user: null, loading: false });
  }, [user]);

  return {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    refreshUser,
    requestPasswordResetOtp,
    resendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPasswordWithOtp,
  };
}
