import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { API_BASE } from "./apiBase";

const AUTH_HINT_COOKIE = "auth_logged_in";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const listeners = new Set();
let sharedAuthState = {
  user: null,
  loading: true,
};
let authBootstrapPromise = null;
let authBootstrapped = false;

function broadcastAuthState(next) {
  sharedAuthState = { ...sharedAuthState, ...next };
  for (const listener of listeners) listener(sharedAuthState);
}

function hasAuthHintCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${AUTH_HINT_COOKIE}=`));
}

export async function syncUserFromServer() {
  const data = await apiFetch("/api/me");
  broadcastAuthState({ user: data.user, loading: false });
  return data.user;
}

async function bootstrapAuth(force = false) {
  if (!force && authBootstrapped) return sharedAuthState.user;
  if (!force && authBootstrapPromise) return authBootstrapPromise;

  if (!force && !hasAuthHintCookie()) {
    authBootstrapped = true;
    broadcastAuthState({ user: null, loading: false });
    return null;
  }

  broadcastAuthState({ loading: true });
  authBootstrapPromise = (async () => {
    try {
      const user = await syncUserFromServer();
      authBootstrapped = true;
      return user;
    } catch {
      authBootstrapped = true;
      broadcastAuthState({ user: null, loading: false });
      return null;
    } finally {
      authBootstrapPromise = null;
    }
  })();

  return authBootstrapPromise;
}

export function useAuth() {
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
    bootstrapAuth();
  }, []);

  const signup = useCallback(async ({ first_name, last_name, email, password }) => {
    broadcastAuthState({ loading: true });
    const data = await apiFetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({ first_name, last_name, email, password }),
    });
    const syncedUser = await bootstrapAuth(true);
    if (syncedUser) return syncedUser;
    broadcastAuthState({ user: data.user, loading: false });
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    broadcastAuthState({ loading: true });
    const data = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const syncedUser = await bootstrapAuth(true);
    if (syncedUser) return syncedUser;
    broadcastAuthState({ user: data.user, loading: false });
    return data.user;
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
    return bootstrapAuth(true);
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
    await apiFetch("/api/logout", { method: "POST" });
    await supabase.auth.signOut().catch(() => {});
    authBootstrapped = true;
    broadcastAuthState({ user: null, loading: false });
  }, []);

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
