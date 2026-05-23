import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import supabase from "@/api/supabaseClient";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/Components/AuthLayout";
import GoogleIcon from "@/Components/GoogleIcon";
import { getSafeRedirectPath, useAuth } from "@/lib/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { getPostAuthRedirect, loginLocalAdmin, checkUserAuth } = useAuth();
  const adminEmail = "pedrooInit@admin";
  const adminPassword = "amandaebiaInit";
  const nextPath = getSafeRedirectPath(searchParams.get("next"), "/marketplace");

  const handleEmailChange = (/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (/** @type {React.FormEvent<HTMLFormElement>} */ e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (email.trim() === adminEmail && password === adminPassword) {
      loginLocalAdmin();
      navigate("/admin", { replace: true });
      return;
    }

    if (!supabase) {
      setError("Supabase não está configurado.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        const authUser = await checkUserAuth();
        navigate(getPostAuthRedirect(authUser || data.session.user, nextPath), { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Invalid email or password");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);

    if (!supabase) {
      setError("Supabase não está configurado.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Google login failed");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
