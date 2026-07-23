import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { authService } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Forgot password — Trackdub Portal" },
      { name: "description", content: "Request a password reset for your Trackdub portal account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setMessage(null);

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const res = await authService.forgotPassword({ email: email.trim(), redirectTo });

    if (!res.ok) {
      setStatus("error");
      setMessage(res.message || "Could not send reset email. Please try again.");
      return;
    }
    // Always show a generic success state to avoid leaking account existence.
    setStatus("sent");
    setMessage("If that email is registered, a reset link has been sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>We'll email you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{message}</p>
              <a href="/login" className="text-sm underline underline-offset-4">
                Back to sign in
              </a>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "submitting"}
                />
              </div>
              {status === "error" && message && (
                <p role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending…" : "Send reset link"}
              </Button>
              <a href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </a>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
