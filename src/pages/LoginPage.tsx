import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Leaf, Mail, Lock, Chrome, Apple, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signInWithGoogle, signInWithApple } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const { error: authError } = await signIn(data.email, data.password);
      if (authError) throw authError;
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    try {
      await signInWithApple();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Apple");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-start pt-6 pb-8 sm:justify-center sm:pt-0 sm:pb-0 px-4 bg-background overflow-y-auto md:-mt-20">
      <div className="w-full max-w-sm md:max-w-3xl space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl gradient-leaf flex items-center justify-center shadow-fab mb-3">
            <Leaf size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Plant Pulse</h1>
          <p className="text-sm text-muted-foreground mt-1">Care for your plants, together</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-10 items-start">
          {/* Social Login */}
          <div className="space-y-5 order-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center md:text-left">
              Sign in with
            </h2>
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 justify-start"
                onClick={handleGoogleSignIn}
              >
                <Chrome size={18} />
                <span className="flex-1 text-left">Continue with Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 justify-start"
                onClick={handleAppleSignIn}
              >
                <Apple size={18} />
                <span className="flex-1 text-left">Continue with Apple</span>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center md:flex-col md:items-center md:pt-8 order-2">
            <div className="w-full border-t border-border md:border-t-0 md:border-l md:h-full md:w-0 md:min-h-[120px]" />
            <span className="px-3 text-xs uppercase text-muted-foreground whitespace-nowrap bg-background md:absolute">
              or
            </span>
          </div>

          {/* Email Login */}
          <div className="space-y-5 order-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center md:text-left">
              Email &amp; password
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gradient-leaf text-primary-foreground hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
