"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = useCallback(async (data: EmailFormData) => {
    setStatus("sending");
    setErrorMsg("");

    try {
      await signIn("resend", { email: data.email, redirect: false });
      setSentEmail(data.email);
      setStatus("sent");
    } catch {
      setErrorMsg("Failed to send magic link. Please try again.");
      setStatus("error");
    }
  }, []);

  if (status === "sent") {
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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate/20 p-8">
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-bold text-midnight">Welcome back</h2>
        <p className="text-sm text-slate">Sign in to your account</p>
      </div>

      {status === "error" && (
        <div className="mb-5 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2 text-danger text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-midnight">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={cn(
                "w-full rounded-lg border bg-white py-3 pl-10 pr-4 text-sm text-midnight placeholder:text-slate/50",
                "focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors",
                errors.email ? "border-danger" : "border-slate/20"
              )}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-danger mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-midnight",
            "hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50 transition-all mt-2"
          )}
        >
          {status === "sending" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Send Magic Link"
          )}
        </button>
      </form>

      <p className="text-xs text-slate/70 text-center mt-5">
        Staff member? Request your login link from your manager.
      </p>
    </div>
  );
}