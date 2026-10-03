"use client";

import { useState } from "react";
import { SectionCard, Btn, PageHead } from "@/components/ui-bits";
import { ThemeSwitcher } from "@/components/theme";

export default function SettingsView({ boot, refresh }) {
  const [name, setName] = useState(boot.name || "");
  const [msg, setMsg] = useState("");
  const [cur, setCur] = useState("");
  const [np, setNp] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [pinBad, setPinBad] = useState(false);

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

  const changePin = async () => {
    const r = await fetch("/api/auth/change-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ currentPin: cur, newPin: np }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setPinBad(false);
      setPinMsg("PIN changed ♡");
      setCur("");
      setNp("");
    } else {
      setPinBad(true);
      setPinMsg(d.error || "could not change PIN");
    }
    setTimeout(() => setPinMsg(""), 2500);
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
    if (!confirm("Reset your planner data? Tasks, habits, goals, food, money, and notes will be deleted. Your name and PIN stay.")) return;
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
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Himanshi" />
          </div>
          <Btn onClick={saveName}>Save</Btn>
          {msg && <span className="pb-2 text-xs font-bold text-[var(--ink)]">{msg}</span>}
        </div>
      </SectionCard>

      <SectionCard emoji="🎨" title="Theme">
        <ThemeSwitcher />
      </SectionCard>

      <SectionCard emoji="🔒" title="Privacy PIN">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>current PIN</label>
            <input type="password" inputMode="numeric" maxLength={4} className={input} value={cur} onChange={(e) => setCur(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </div>
          <div>
            <label className={label}>new 4-digit PIN</label>
            <input type="password" inputMode="numeric" maxLength={4} className={input} value={np} onChange={(e) => setNp(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Btn onClick={changePin} disabled={cur.length !== 4 || np.length !== 4}>Change PIN</Btn>
          {pinMsg && <span className={`text-xs font-bold ${pinBad ? "text-destructive" : "text-[var(--ink)]"}`}>{pinMsg}</span>}
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
          Sample data only fills collections that are still empty, so you can explore every view. Reset clears planner entries and keeps your name and PIN.
        </p>
      </SectionCard>
    </div>
  );
}
