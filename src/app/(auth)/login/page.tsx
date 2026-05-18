"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      await signIn("resend", { email, redirect: false });
      setStatus("sent");
    } catch {
      setError("Failed to send magic link. Please try again.");
      setStatus("error");
    }
  }, [email]);

  if (status === "sent") {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/10">
          <CheckCircle className="size-7 text-teal" />
        </div>
        <h2 className="text-xl font-bold text-midnight font-display">Check your email</h2>
        <p className="text-sm text-slate">
          A magic sign-in link has been sent to <strong className="text-midnight">{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-midnight font-display">Sign in</h2>
        <p className="text-sm text-slate">Enter your email to receive a magic link</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate" />
          <input
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-slate/20 bg-white py-3 pl-10 pr-4 text-sm text-midnight placeholder:text-slate/50",
              "focus:border-midnight focus:outline-none focus:ring-1 focus:ring-midnight",
              "transition-colors",
            )}
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending" || !email}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-midnight px-4 py-3 text-sm font-semibold text-white",
            "hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all",
          )}
        >
          {status === "sending" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Send Magic Link
              <ArrowRight className="size-4" />
            </>
          )}
        </button>

        {status === "error" && (
          <p className="text-center text-xs text-danger">{error}</p>
        )}
      </form>
    </div>
  );
}
