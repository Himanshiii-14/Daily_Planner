"use client";

import { useCallback, useEffect, useState } from "react";
import PinGate from "@/components/PinGate";
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
  return (
    <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
      <span className="floaty absolute left-[6%] top-[12%] text-4xl opacity-20">🌸</span>
      <span className="floaty absolute right-[8%] top-[20%] text-3xl opacity-20" style={{ animationDelay: "1.2s" }}>☁️</span>
      <span className="floaty absolute bottom-[14%] left-[10%] text-3xl opacity-20" style={{ animationDelay: "2.1s" }}>🌿</span>
      <span className="floaty absolute bottom-[22%] right-[12%] text-4xl opacity-20" style={{ animationDelay: "0.6s" }}>🎀</span>
      <span className="floaty absolute left-[45%] top-[6%] text-2xl opacity-15" style={{ animationDelay: "1.8s" }}>⭐</span>
    </div>
  );
}

export default function App() {
  const [boot, setBoot] = useState(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("home");
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
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
    setDark(localStorage.getItem("mlf-theme") === "dark");
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("mlf-theme", dark ? "dark" : "light");
  }, [dark, themeReady]);

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

  if (locked) return <PinGate onUnlock={load} />;
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
    settings: <SettingsView {...props} dark={dark} setDark={setDark} />,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Decor />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border/60 bg-sidebar/95 backdrop-blur md:flex">
        <div className="px-6 pb-4 pt-7">
          <div className="font-display text-2xl font-bold">🌷 My Little Life</div>
          <div className="mt-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">plan · do · track · reflect · improve</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                view === n.id ? "bg-primary/15 text-primary shadow-sm" : "text-foreground/65 hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              <span className="text-base">{n.emoji}</span> {n.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t border-border/50 px-5 py-4">
          <span className="text-sm font-semibold text-muted-foreground">♡ {boot.name}</span>
          <button type="button" onClick={() => setDark(!dark)} className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-card text-sm transition hover:bg-muted" title="toggle theme">
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </aside>

      <main className="relative z-10 px-4 pb-32 pt-5 md:pb-10 md:pl-64 md:pr-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <span className="font-display text-xl font-bold">🌷 My Little Life</span>
            <button type="button" onClick={() => setDark(!dark)} className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-card text-sm">
              {dark ? "☀️" : "🌙"}
            </button>
          </div>

          <div className="relative z-20 mb-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 search tasks, goals, notes…"
              className="w-full rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm shadow-card outline-none ring-ring focus:ring-2"
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
        className="fixed bottom-8 right-8 z-40 hidden h-14 w-14 place-items-center rounded-full bg-primary text-2xl text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-110 active:scale-95 md:grid"
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
        <button type="button" onClick={() => onAdd(null)} className="grid h-12 w-12 place-items-center rounded-full bg-primary text-xl text-primary-foreground shadow-md shadow-primary/40 active:scale-95">
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
