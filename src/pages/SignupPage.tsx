import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Leaf, Mail, Lock, User, Chrome, Apple, CheckCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { signUp, signInWithGoogle, signInWithApple } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be 20 characters or less"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupForm = z.infer<typeof schema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: SignupForm) => {
    setError(null);
    setConfirmationPending(false);
    try {
      const result = await signUp(data.email, data.password, data.username);
      if (result.session) {
        navigate("/");
      } else if (result.user) {
        setConfirmationPending(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
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

  if (confirmationPending) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-start pt-6 pb-8 sm:justify-center sm:pt-0 sm:pb-0 px-4 bg-background overflow-y-auto md:-mt-20">
        <div className="w-full max-w-sm text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-leaf flex items-center justify-center shadow-fab mb-3">
              <Leaf size={28} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Plant Pulse</h1>
          </div>
          <Card className="border-border shadow-card">
            <CardContent className="pt-6 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a confirmation link to your email. Click the link to activate your account.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          {/* Social Sign Up */}
          <div className="space-y-5 order-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center md:text-left">
              Sign up with
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

          {/* Email Sign Up */}
          <div className="space-y-5 order-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center md:text-left">
              Create with email
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="plantlover123"
                    className="pl-10"
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>

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
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
