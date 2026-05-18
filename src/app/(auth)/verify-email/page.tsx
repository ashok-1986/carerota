"use client";

import { CheckCircle, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/10">
        <Mail className="size-7 text-teal" />
      </div>
      <h2 className="text-xl font-bold text-midnight font-display">Check your email</h2>
      <p className="text-sm text-slate">
        A sign-in link has been sent to your email address.
      </p>
      <CheckCircle className="mx-auto size-5 text-teal" />
    </div>
  );
}
