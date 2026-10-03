"use client";

import { useState } from "react";
import { ThemeSwitcher, useTheme } from "@/components/theme";

export default function PinGate({ onUnlock, name = "Himanshi" }) {
  const { current } = useTheme();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ pin }),
      });
      if (r.ok) {
        onUnlock();
      } else {
        const d = await r.json().catch(() => ({}));
        setErr(d.error || "Wrong PIN");
        setPin("");
      }
    } catch {
      setErr("Could not reach the server. Is MongoDB running?");
    }
    setBusy(false);
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
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
      <form
        onSubmit={submit}
        className="sticker anim-fade-up w-full max-w-sm rotate-[-0.6deg] bg-card p-8 text-center"
      >
        <div className="mb-3 flex justify-center"><ThemeSwitcher compact /></div>
        <div className="breathe mx-auto mb-3 text-5xl">{current.emoji}</div>
        <h1 className="font-display text-2xl font-bold">My Little Life</h1>
        <p className="mt-1 text-sm text-muted-foreground">{name}&apos;s little corner of calm ♡</p>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="••••"
          className="mx-auto mt-6 w-40 rounded-2xl border border-border bg-background px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none ring-ring focus:ring-2"
        />
        {err && <p className="mt-3 text-sm font-semibold text-destructive">{err}</p>}
        <button
          type="submit"
          disabled={busy || pin.length < 4}
          className="mt-5 w-full rounded-2xl border-[2.5px] border-[var(--ink)] bg-[var(--pop)] py-3 font-bold text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40"
        >
          {busy ? "Opening…" : "Unlock ♡"}
        </button>
        <p className="mt-4 text-xs text-muted-foreground">default PIN is 1234 — change it in Settings</p>
      </form>
    </div>
  );
}
