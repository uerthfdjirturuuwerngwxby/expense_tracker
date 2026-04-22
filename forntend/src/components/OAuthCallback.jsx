import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        navigate("/login?error=oauth_failed");
        return;
      }

      const response = await fetch("/api/auth/google-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.session.access_token,
        }),
      });

      if (!response.ok) {
        navigate("/login?error=oauth_failed");
        return;
      }

      
      window.location.href = "/expenses";
    };

    handleOAuth();
  }, [navigate]);

  return <div>Signing you in...</div>;
}