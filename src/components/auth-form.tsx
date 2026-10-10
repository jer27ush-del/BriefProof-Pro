"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Mail } from "lucide-react";
import { z } from "zod";
import { browserSupabase } from "@/lib/supabase/client";
import { safeNext } from "@/lib/domain";
import { Field, Button, Notice, message } from "./ui";
type Mode = "login" | "signup" | "forgot-password" | "reset-password";
export function AuthForm({
  mode,
  configured,
  next = "/dashboard",
  initialError = "",
}: {
  mode: Mode;
  configured: boolean;
  next?: string;
  initialError?: string;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initialError),
    [success, setSuccess] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      if (mode !== "reset-password")
        z.email("Enter a valid email address.").parse(email);
      if (mode !== "forgot-password")
        z.string()
          .min(mode === "login" ? 1 : 10, "Use at least 10 characters.")
          .max(128)
          .parse(password);
      const db = browserSupabase();
      const origin = window.location.origin;
      if (mode === "login") {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(safeNext(next));
        router.refresh();
      } else if (mode === "signup") {
        const { error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name.trim().slice(0, 100) },
            emailRedirectTo:
              origin +
              "/auth/callback?next=" +
              encodeURIComponent(safeNext(next)),
          },
        });
        if (error) throw error;
        setSuccess(
          "Check your email to verify your account. If you already have an account, sign in or reset your password.",
        );
        setPassword("");
      } else if (mode === "forgot-password") {
        const { error } = await db.auth.resetPasswordForEmail(email, {
          redirectTo: origin + "/auth/callback?next=/reset-password",
        });
        if (error) throw error;
        setSuccess(
          "If this address has an account, a password reset link is on its way.",
        );
      } else {
        const { error } = await db.auth.updateUser({ password });
        if (error) throw error;
        await db.auth.signOut();
        router.replace(
          "/login?notice=Your+password+was+updated.+Sign+in+with+your+new+password.",
        );
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof z.ZodError ? e.issues[0].message : message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="auth-form">
      {!configured && (
        <Notice>
          Account services need configuration.{" "}
          <Link href="/setup">View the setup guide</Link> or{" "}
          <Link href="/discover">explore sample creators</Link>.
        </Notice>
      )}
      {error && <Notice error>{error}</Notice>}
      {success && <Notice>{success}</Notice>}
      {mode === "signup" && (
        <Field label="Your name">
          {(id) => (
            <input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              maxLength={100}
            />
          )}
        </Field>
      )}
      {mode !== "reset-password" && (
        <Field label="Email address">
          {(id) => (
            <input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@yourbrand.com"
              required
              maxLength={254}
            />
          )}
        </Field>
      )}
      {mode !== "forgot-password" && (
        <Field
          label={mode === "reset-password" ? "New password" : "Password"}
          hint={
            mode !== "login"
              ? "At least 10 characters. Use a unique password."
              : undefined
          }
        >
          {(id) => (
            <div className="password-field">
              <input
                id={id}
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "login" ? 1 : 10}
                maxLength={128}
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
        </Field>
      )}
      {mode === "login" && (
        <Link className="text-link" href="/forgot-password">
          Forgot password?
        </Link>
      )}
      <Button
        type="submit"
        variant="primary full"
        pending={busy}
        disabled={!configured}
      >
        {mode === "login"
          ? "Sign in"
          : mode === "signup"
            ? "Create your account"
            : mode === "forgot-password"
              ? "Send reset link"
              : "Update password"}
        {mode === "forgot-password" ? (
          <Mail size={17} />
        ) : (
          <ArrowRight size={17} />
        )}
      </Button>
      <p className="auth-switch">
        {mode === "login" ? (
          <>
            New to BriefProof?{" "}
            <Link href={"/signup?next=" + encodeURIComponent(safeNext(next))}>
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}
