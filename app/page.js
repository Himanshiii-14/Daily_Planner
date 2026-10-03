"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import AddModal from "@/components/AddModal";
import Dashboard from "@/components/views/Dashboard";
import Today from "@/components/views/Today";
import Habits from "@/components/views/Habits";
import Weekly from "@/components/views/Weekly";
import Monthly from "@/components/views/Monthly";
import YearlyView from "@/components/views/YearlyView";
import Food from "@/components/views/Food";
import MoneyView from "@/components/views/MoneyView";
import Notes from "@/components/views/Notes";
import CalendarView from "@/components/views/CalendarView";
import SettingsView from "@/components/views/SettingsView";
import { localToday, api } from "@/lib/shared";
import { ThemeSwitcher, useTheme } from "@/components/theme";

const NAV = [
  { id: "home", emoji: "🌷", label: "Home" },
  { id: "today", emoji: "☀️", label: "Today" },
  { id: "habits", emoji: "🌱", label: "Habits" },
  { id: "weekly", emoji: "🌸", label: "Weekly" },
  { id: "monthly", emoji: "🗓️", label: "Monthly" },
  { id: "yearly", emoji: "✨", label: "Yearly" },
  { id: "food", emoji: "🥗", label: "Food" },
  { id: "money", emoji: "💰", label: "Money" },
  { id: "notes", emoji: "📝", label: "Notes" },
  { id: "calendar", emoji: "📅", label: "Calendar" },
  { id: "settings", emoji: "⚙️", label: "Settings" },
];

const MOBILE_MAIN = ["home", "today", "habits"];

function Decor() {
  const { current } = useTheme();
  const spots = [
    "left-[6%] top-[12%] rotate-12 text-4xl",
    "right-[8%] top-[20%] -rotate-6 text-3xl",
    "bottom-[14%] left-[10%] rotate-3 text-3xl",
    "bottom-[22%] right-[12%] -rotate-12 text-4xl",
    "left-[45%] top-[6%] rotate-6 text-2xl",
  ];
  return (
    <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
      {current.stickers.map((emoji, i) => (
        <span key={emoji + i} className={`floaty absolute opacity-40 ${spots[i]}`} style={{ animationDelay: `${i * 0.4}s` }}>
          {emoji}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const { current } = useTheme();
  const [boot, setBoot] = useState(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("home");
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const today = localToday();

  const load = useCallback(async () => {
    try {
      const d = await api(`/bootstrap?today=${today}`);
      setBoot(d);
      setLocked(false);
      setError("");
    } catch (e) {
      if (e.locked) {
        setLocked(true);
        setError("");
      } else {
        setError(e.message || "Could not load the planner.");
      }
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const d = await api(`/search?q=${encodeURIComponent(q)}`);
        setResults(d.results || []);
      } catch {
        setResults(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const onAdd = (preset) => {
    setAddPreset(preset || null);
    setAddOpen(true);
  };
  const go = (id) => {
    setView(id);
    setMoreOpen(false);
    setQ("");
    setResults(null);
  };

  if (locked) return <AuthGate onUnlock={load} />;
  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div className="max-w-md space-y-3">
          <div className="text-5xl">🌷</div>
          <h1 className="font-display text-2xl font-bold">Planner can&apos;t start yet</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button type="button" onClick={load} className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (!boot) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="breathe text-6xl">🌷</div>
      </div>
    );
  }

  const props = { boot, refresh: load, today, onAdd };
  const views = {
    home: <Dashboard {...props} go={go} />,
    today: <Today {...props} />,
    habits: <Habits {...props} />,
    weekly: <Weekly {...props} />,
    monthly: <Monthly {...props} />,
    yearly: <YearlyView {...props} />,
    food: <Food {...props} />,
    money: <MoneyView {...props} />,
    notes: <Notes {...props} />,
    calendar: <CalendarView {...props} />,
    settings: <SettingsView {...props} />,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Decor />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 -rotate-[0.3deg] flex-col border-r-[3px] border-[var(--ink)] bg-[var(--pop2)] shadow-[6px_0_0_var(--pop)] md:flex dark:border-[var(--ink)] dark:bg-[#2A3548] dark:shadow-[6px_0_0_var(--dust)]">
        <div className="px-6 pb-4 pt-7">
          <div className="font-display text-2xl font-bold">{current.emoji} My Little Life</div>
          <div className="mt-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">plan · do · track · reflect · improve</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 text-sm font-bold transition-all ${
                view === n.id
                  ? "rotate-[-1deg] border-[var(--ink)] bg-[var(--pop)] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)]"
                  : "border-transparent text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--paper)] dark:text-[var(--paper)]"
              }`}
            >
              <span className="text-base">{n.emoji}</span> {n.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border/50 px-4 py-3">
          <div className="mb-2 text-sm font-semibold text-muted-foreground">♡ {boot.name}</div>
          {boot.email && <div className="mb-2 truncate text-[11px] text-muted-foreground">{boot.email}</div>}
          <ThemeSwitcher compact />
        </div>
      </aside>

      <main className="relative z-10 px-4 pb-32 pt-5 md:pb-10 md:pl-64 md:pr-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <span className="font-display text-xl font-bold">{current.emoji} My Little Life</span>
            <ThemeSwitcher compact />
          </div>

          <div className="relative z-20 mb-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 search tasks, goals, notes…"
              className="w-full rounded-2xl border-[2.5px] border-[var(--ink)] bg-card px-5 py-2.5 text-sm shadow-[3px_3px_0_var(--pop2)] outline-none ring-ring focus:ring-2"
            />
            {results && (
              <div className="absolute inset-x-0 top-12 max-h-80 overflow-y-auto rounded-2xl border border-border/70 bg-card p-2 shadow-soft">
                {results.length === 0 && <p className="p-3 text-sm text-muted-foreground">nothing found — try another word 🌸</p>}
                {results.map((r, i) => (
                  <div key={`${r.type}-${r.label}-${i}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted/60">
                    <span>{r.emoji}</span>
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{r.type}{r.date ? ` · ${r.date}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {views[view]}
        </div>
      </main>

      <button
        type="button"
        onClick={() => onAdd(null)}
        title="add something lovely"
        className="fixed bottom-8 right-8 z-40 hidden h-14 w-14 rotate-3 place-items-center rounded-2xl border-[2.5px] border-[var(--ink)] bg-[var(--pop)] text-3xl text-[var(--ink)] shadow-[4px_4px_0_var(--ink)] transition-transform hover:rotate-0 hover:scale-110 active:translate-x-1 active:translate-y-1 active:shadow-none md:grid"
      >
        ＋
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border/60 bg-card/95 px-2 py-2 backdrop-blur md:hidden">
        {MOBILE_MAIN.map((id) => {
          const n = NAV.find((x) => x.id === id);
          return (
            <button key={id} type="button" onClick={() => go(id)} className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-bold ${view === id ? "text-primary" : "text-muted-foreground"}`}>
              <span className="text-lg">{n.emoji}</span>
              {n.label}
            </button>
          );
        })}
        <button type="button" onClick={() => onAdd(null)} className="grid h-12 w-12 rotate-3 place-items-center rounded-2xl border-[2.5px] border-[var(--ink)] bg-[var(--pop)] text-xl text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] active:translate-y-0.5 active:shadow-none">
          ＋
        </button>
        <button type="button" onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-bold text-muted-foreground">
          <span className="text-lg">🎀</span>
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-t border-border/60 bg-card p-5 pb-9 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <div className="grid grid-cols-4 gap-3">
              {NAV.filter((n) => !MOBILE_MAIN.includes(n.id)).map((n) => (
                <button key={n.id} type="button" onClick={() => go(n.id)} className="grid place-items-center gap-1 rounded-2xl border border-border/60 bg-background py-3 text-[11px] font-bold">
                  <span className="text-xl">{n.emoji}</span>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} today={today} preset={addPreset} />
    </div>
  );
}
