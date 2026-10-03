"use client";

import { useState } from "react";
import { ThemeSwitcher, useTheme } from "@/components/theme";

export default function AuthGate({ onUnlock }) {
  const { current } = useTheme();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr("");
    if (mode === "signup" && password !== confirm) {
      setErr("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(mode === "signup" ? "/api/auth/signup" : "/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) onUnlock();
      else setErr(d.error || "Could not sign in");
    } catch {
      setErr("Could not reach the server. Is MongoDB running?");
    }
    setBusy(false);
  };

  const input = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2";

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 select-none">
        {current.stickers.slice(0, 4).map((emoji, i) => (
          <span
            key={emoji + i}
            className={`floaty absolute text-3xl opacity-50 ${["left-[12%] top-[16%] rotate-12", "right-[14%] top-[24%] -rotate-6", "bottom-[18%] left-[18%] rotate-3", "bottom-[26%] right-[16%] -rotate-12"][i]}`}
            style={{ animationDelay: `${i * 0.5}s` }}
          >
            {emoji}
          </span>
        ))}
      </div>
      <form onSubmit={submit} className="sticker anim-fade-up w-full max-w-sm bg-card p-8 text-center">
        <div className="mb-3 flex justify-center">
          <ThemeSwitcher compact />
        </div>
        <div className="breathe mx-auto mb-3 text-5xl">{current.emoji}</div>
        <h1 className="font-display text-2xl font-bold">My Little Life</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup" ? "make your own little planner ♡" : "sign in to your planner ♡"}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            ["signin", "Sign in"],
            ["signup", "Sign up"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setErr("");
              }}
              className={`rounded-xl border-2 py-2 text-sm font-bold ${mode === id ? "border-[var(--ink)] bg-[var(--pop)] text-[var(--ink)]" : "border-transparent bg-background text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3 text-left">
          {mode === "signup" && (
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />
          )}
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" required />
          <input
            className={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
          {mode === "signup" && (
            <input
              className={input}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          )}
        </div>
        {err && <p className="mt-3 text-sm font-semibold text-destructive">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-2xl border-[2.5px] border-[var(--ink)] bg-[var(--pop)] py-3 font-bold text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40"
        >
          {busy ? "One moment…" : mode === "signup" ? "Create account ♡" : "Sign in ♡"}
        </button>
        <p className="mt-4 text-xs text-muted-foreground">Each account has its own tasks, habits, and notes. Password needs 8 characters.</p>
      </form>
    </div>
  );
}
