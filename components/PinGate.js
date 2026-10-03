"use client";

import { useState } from "react";

export default function PinGate({ onUnlock, name = "Himanshi" }) {
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
        <span className="floaty absolute left-[12%] top-[16%] text-3xl opacity-30">🌸</span>
        <span className="floaty absolute right-[14%] top-[24%] text-2xl opacity-30" style={{ animationDelay: "1s" }}>☁️</span>
        <span className="floaty absolute bottom-[18%] left-[18%] text-2xl opacity-30" style={{ animationDelay: "2s" }}>🌿</span>
        <span className="floaty absolute bottom-[26%] right-[16%] text-3xl opacity-30" style={{ animationDelay: "0.5s" }}>🎀</span>
      </div>
      <form
        onSubmit={submit}
        className="anim-fade-up w-full max-w-sm rounded-[2rem] border border-border/70 bg-card p-8 text-center shadow-soft"
      >
        <div className="breathe mx-auto mb-3 text-5xl">🌷</div>
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
          className="mt-5 w-full rounded-full bg-primary py-3 font-bold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
        >
          {busy ? "Opening…" : "Unlock ♡"}
        </button>
        <p className="mt-4 text-xs text-muted-foreground">default PIN is 1234 — change it in Settings</p>
      </form>
    </div>
  );
}
