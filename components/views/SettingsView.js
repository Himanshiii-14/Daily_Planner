"use client";

import { useState } from "react";
import { SectionCard, Btn, PageHead } from "@/components/ui-bits";
import { ThemeSwitcher } from "@/components/theme";

export default function SettingsView({ boot, refresh }) {
  const [name, setName] = useState(boot.name || "");
  const [msg, setMsg] = useState("");
  const [cur, setCur] = useState("");
  const [np, setNp] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwBad, setPwBad] = useState(false);

  const saveName = async () => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name }),
    });
    setMsg("saved ♡");
    setTimeout(() => setMsg(""), 1500);
    refresh();
  };

  const changePassword = async () => {
    const r = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ currentPassword: cur, newPassword: np }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setPwBad(false);
      setPwMsg("password changed ♡");
      setCur("");
      setNp("");
    } else {
      setPwBad(true);
      setPwMsg(d.error || "could not change password");
    }
    setTimeout(() => setPwMsg(""), 2500);
  };

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST", credentials: "same-origin" });
    refresh();
  };

  const seed = async () => {
    const r = await fetch("/api/seed", { method: "POST", credentials: "same-origin" });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg(d.error || "could not add sample data");
      return;
    }
    setMsg("sample data added ♡");
    setTimeout(() => setMsg(""), 1800);
    refresh();
  };

  const wipe = async () => {
    if (!confirm("Reset your planner data? Tasks, habits, goals, food, money, and notes will be deleted. Your account stays.")) return;
    await fetch("/api/seed", { method: "DELETE", credentials: "same-origin" });
    refresh();
  };

  const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground";
  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead emoji="⚙️" title="Settings" sub="make this little planner truly yours ♡" />

      <SectionCard emoji="🎀" title="Your name">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className={label}>greeting name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            {boot.email && <p className="mt-2 text-xs text-muted-foreground">{boot.email}</p>}
          </div>
          <Btn onClick={saveName}>Save</Btn>
          {msg && <span className="pb-2 text-xs font-bold text-[var(--ink)]">{msg}</span>}
        </div>
      </SectionCard>

      <SectionCard emoji="🎨" title="Theme">
        <ThemeSwitcher />
      </SectionCard>

      <SectionCard emoji="🔒" title="Password">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>current password</label>
            <input type="password" autoComplete="current-password" className={input} value={cur} onChange={(e) => setCur(e.target.value)} />
          </div>
          <div>
            <label className={label}>new password</label>
            <input type="password" autoComplete="new-password" className={input} value={np} onChange={(e) => setNp(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Btn onClick={changePassword} disabled={cur.length < 8 || np.length < 8}>Change password</Btn>
          <button type="button" onClick={signOut} className="rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted">
            Sign out
          </button>
          {pwMsg && <span className={`text-xs font-bold ${pwBad ? "text-destructive" : "text-[var(--ink)]"}`}>{pwMsg}</span>}
        </div>
      </SectionCard>

      <SectionCard emoji="🧺" title="Data">
        <div className="flex flex-wrap gap-3">
          <Btn tone="sage" onClick={seed}>✨ Add sample data</Btn>
          <button type="button" onClick={wipe} className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-bold text-destructive transition hover:bg-destructive/10">
            🗑️ Reset planner data
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Sample data only fills your empty lists. Reset clears your planner and keeps your account. Other people keep their own data.
        </p>
      </SectionCard>
    </div>
  );
}
