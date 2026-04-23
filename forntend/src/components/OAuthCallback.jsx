import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { API_BASE } from "./apiBase";
import { syncUserFromServer } from "./useAuth";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleOAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");
        const errorDescription = params.get("error_description");

        if (error) {
          navigate(`/login?error=${encodeURIComponent(errorDescription || error)}`, { replace: true });
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data?.session?.access_token) {
          navigate("/login?error=oauth_failed", { replace: true });
          return;
        }

        const response = await fetch(`${API_BASE}/api/auth/google-session`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: data.session.access_token }),
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          navigate(`/login?error=${encodeURIComponent(json.message || "oauth_failed")}`, { replace: true });
          return;
        }

        await syncUserFromServer();
        navigate("/expenses", { replace: true });
      } catch (err) {
        console.error("OAuth callback failed:", err);
        navigate("/login?error=oauth_failed", { replace: true });
      }
    };

    handleOAuth();
  }, [navigate]);

  return <div>Signing you in...</div>;
}
