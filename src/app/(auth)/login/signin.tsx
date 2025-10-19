"use client";

import { authClient } from "@/lib/better-auth-client";
import React from "react";
import { useRouter } from "next/navigation";

export function SignIn({ callbackUrl }: { callbackUrl: string }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full px-4 py-2 rounded-md bg-black text-white disabled:opacity-60"
    >
      {loading ? "Signing in..." : "Continue with Google"}
    </button>
  );
}

export function CredentialsForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      });

      if (result.error) {
        setError(result.error.message || "Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Sign-in error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid gap-2" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        className="w-full px-3 py-2 rounded-md border"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full px-3 py-2 rounded-md border"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error ? <div className="text-sm text-rose-500">{error}</div> : null}
      <button
        disabled={loading}
        className="w-full px-4 py-2 rounded-md border disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in with Credentials"}
      </button>
    </form>
  );
}
