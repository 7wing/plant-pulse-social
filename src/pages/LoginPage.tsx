import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Leaf, Mail, Lock, Chrome, Apple } from "lucide-react";

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
  const [showEmailForm, setShowEmailForm] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
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

        {!showEmailForm ? (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
            >
              <Chrome size={16} />
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleAppleSignIn}
            >
              <Apple size={16} />
              Continue with Apple
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate("/signup")}
            >
              <Mail size={16} />
              Sign up with email
            </Button>

            <Button
              type="button"
              className="w-full gradient-leaf text-primary-foreground hover:opacity-90"
              onClick={() => setShowEmailForm(true)}
            >
              Log in
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
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
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...register("password")}
                  />
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

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setShowEmailForm(false)}
            >
              Back to options
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
