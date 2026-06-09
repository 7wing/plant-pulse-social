import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Leaf } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Completing sign in…");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const type = searchParams.get("type");

    // Handle OAuth / provider errors first
    if (errorParam) {
      setError(errorDescription || errorParam);
      return;
    }

    // Show contextual message based on callback type
    if (type === "signup") setMessage("Confirming your email…");
    else if (type === "recovery") setMessage("Resetting your password…");
    else if (type === "magiclink") setMessage("Signing you in…");

    async function processCallback() {
      try {
        if (code) {
          // PKCE flow (OAuth, email confirmation, magic link)
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          // Fallback for implicit-grant / hash-based tokens
          // Supabase client auto-detects tokens in the URL hash on getSession()
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session) {
            throw new Error("No authorization code or session found.");
          }
        }

        // Clean tokens from the URL so they don't linger in the address bar
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to complete sign in.");
      }
    }

    processCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl gradient-leaf flex items-center justify-center shadow-fab mb-3 mx-auto">
            <Leaf size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Sign In Error</h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="text-primary font-medium hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl gradient-leaf flex items-center justify-center shadow-fab mb-4 animate-pulse">
          <Leaf size={24} className="text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
