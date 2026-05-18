"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Schemas ─────────────────────────────────────────────── */

const credentialsSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type CredentialsFormData = z.infer<typeof credentialsSchema>;

const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

/* ── Page ────────────────────────────────────────────────── */

export default function LoginPage() {
  /* credentials state */
  const [credStatus, setCredStatus] = useState<"idle" | "sending" | "error">("idle");
  const [credError, setCredError] = useState("");

  /* magic-link state */
  const [mlStatus, setMlStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [mlError, setMlError] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  /* forms */
  const credForm = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
  });

  const mlForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  /* ── Handlers ──────────────────────────────────────────── */

  const handleCredentials = useCallback(async (data: CredentialsFormData) => {
    setCredStatus("sending");
    setCredError("");

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setCredError("Invalid email or password.");
        setCredStatus("error");
      } else {
        // Redirect to dashboard on success
        window.location.href = "/";
      }
    } catch {
      setCredError("Something went wrong. Please try again.");
      setCredStatus("error");
    }
  }, []);

  const handleMagicLink = useCallback(async (data: MagicLinkFormData) => {
    setMlStatus("sending");
    setMlError("");

    try {
      await signIn("resend", { email: data.email, redirect: false });
      setSentEmail(data.email);
      setMlStatus("sent");
    } catch {
      setMlError("Failed to send magic link. Please try again.");
      setMlStatus("error");
    }
  }, []);

  /* ── Magic link sent confirmation ──────────────────────── */

  if (mlStatus === "sent") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate/20 p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/10">
            <CheckCircle className="size-7 text-teal" />
          </div>
          <h2 className="text-xl font-bold text-midnight">Check your email</h2>
          <p className="text-sm text-slate">
            A magic sign-in link has been sent to{" "}
            <strong className="text-midnight font-medium">{sentEmail}</strong>.
          </p>
          <p className="text-xs text-slate/60">
            Click the link in the email to sign in. Check your spam folder if you don&apos;t see it.
          </p>
          <button
            type="button"
            onClick={() => setMlStatus("idle")}
            className="text-sm text-gold hover:text-gold/80 font-medium transition-colors mt-2"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  /* ── Main login form ───────────────────────────────────── */

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate/20 p-8 space-y-6">
      {/* Section 1 — Manager Login (Credentials) */}
      <div>
        <div className="space-y-1 mb-5">
          <h2 className="text-2xl font-bold text-midnight">Manager Sign In</h2>
          <p className="text-sm text-slate">Use your manager credentials</p>
        </div>

        {credStatus === "error" && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2 text-danger text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{credError}</span>
          </div>
        )}

        <form onSubmit={credForm.handleSubmit(handleCredentials)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="cred-email" className="text-sm font-medium text-midnight">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
              <input
                id="cred-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={cn(
                  "w-full rounded-lg border bg-white py-3 pl-10 pr-4 text-sm text-midnight placeholder:text-slate/50",
                  "focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors",
                  credForm.formState.errors.email ? "border-danger" : "border-slate/20"
                )}
                {...credForm.register("email")}
              />
            </div>
            {credForm.formState.errors.email && (
              <p className="text-xs text-danger mt-1">{credForm.formState.errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="cred-password" className="text-sm font-medium text-midnight">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
              <input
                id="cred-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  "w-full rounded-lg border bg-white py-3 pl-10 pr-4 text-sm text-midnight placeholder:text-slate/50",
                  "focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors",
                  credForm.formState.errors.password ? "border-danger" : "border-slate/20"
                )}
                {...credForm.register("password")}
              />
            </div>
            {credForm.formState.errors.password && (
              <p className="text-xs text-danger mt-1">{credForm.formState.errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={credStatus === "sending"}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-midnight",
              "hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50 transition-all mt-1"
            )}
          >
            {credStatus === "sending" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      {/* ── Divider ──────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate/60 font-medium">or</span>
        </div>
      </div>

      {/* Section 2 — Staff Login (Magic Link) */}
      <div>
        <div className="space-y-1 mb-4">
          <h3 className="text-lg font-semibold text-midnight">Staff Magic Link</h3>
          <p className="text-xs text-slate">For care staff — request access from your manager</p>
        </div>

        {mlStatus === "error" && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2 text-danger text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{mlError}</span>
          </div>
        )}

        <form onSubmit={mlForm.handleSubmit(handleMagicLink)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="ml-email" className="text-sm font-medium text-midnight">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
              <input
                id="ml-email"
                type="email"
                placeholder="staff@example.com"
                autoComplete="email"
                className={cn(
                  "w-full rounded-lg border bg-white py-3 pl-10 pr-4 text-sm text-midnight placeholder:text-slate/50",
                  "focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors",
                  mlForm.formState.errors.email ? "border-danger" : "border-slate/20"
                )}
                {...mlForm.register("email")}
              />
            </div>
            {mlForm.formState.errors.email && (
              <p className="text-xs text-danger mt-1">{mlForm.formState.errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mlStatus === "sending"}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold",
              "border-2 border-midnight/20 text-midnight bg-white",
              "hover:bg-midnight/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            )}
          >
            {mlStatus === "sending" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Magic Link
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}