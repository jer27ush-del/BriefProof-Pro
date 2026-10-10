"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/client";
import { Button, useToast, message } from "./ui";
export function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="BriefProof home">
      <svg
        width="27"
        height="30"
        viewBox="0 0 27 30"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 2H13C25 2 26 15 14 16H2V2Z"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M2 16H14C26 16 26 28 14 28H2V16Z"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path d="M10 12L14 16L25 4" stroke="#5942cc" strokeWidth="3" />
      </svg>
      <span>
        briefproof<span className="wordmark-dot">.</span>
      </span>
    </Link>
  );
}
export function Header({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    router = useRouter(),
    path = usePathname(),
    toast = useToast();
  async function logout() {
    setBusy(true);
    try {
      const { error } = await browserSupabase().auth.signOut();
      if (error) throw error;
      router.push("/");
      router.refresh();
      setOpen(false);
    } catch (e) {
      toast(message(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <header className="header">
      <Wordmark />
      <button
        className="mobile-toggle"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? "open" : ""} aria-label="Main navigation">
        <Link
          aria-current={path === "/discover" ? "page" : undefined}
          href="/discover"
          onClick={() => setOpen(false)}
        >
          Discover creators
        </Link>
        <Link href="/#how-it-works" onClick={() => setOpen(false)}>
          How it works
        </Link>
        <span className="nav-divider" />
        {email ? (
          <>
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <LayoutDashboard size={16} /> Workspace
            </Link>
            <Button
              variant="ghost small"
              pending={busy}
              onClick={logout}
              title={email}
            >
              <LogOut size={15} /> Sign out
            </Button>
          </>
        ) : (
          <Link href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        )}
        <Link
          href="/brief/new"
          className="button primary small"
          onClick={() => setOpen(false)}
        >
          Get started <ArrowUpRight size={16} />
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Wordmark />
        <p>Great creative. Clearer decisions.</p>
        <small>Fictional sample creators and concept artwork.</small>
      </div>
      <div>
        <Link href="/discover">Discover creators</Link>
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/setup">Setup guide</Link>
      </div>
      <div>
        <Link href="/policies">Privacy & terms</Link>
        <Link href="/brief/new">Build a brief</Link>
        <p>BriefProof / 2026</p>
      </div>
    </footer>
  );
}
