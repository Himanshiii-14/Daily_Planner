"use client";

import { useState } from "react";
import { SectionCard, Bar, CuteCheck, Burst, StatChip } from "@/components/ui-bits";
import { greeting, fmtDay, pickQuote, post, patch } from "@/lib/shared";

export default function Dashboard({ boot, go, refresh, today, onAdd }) {
  const s = boot.stats || {};
  const totalDone = (s.taskDone || 0) + (s.habitDone || 0);
  const totalAll = (s.taskTotal || 0) + (s.habitTotal || 0);
  const pct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
  const quote = pickQuote(today);

  const toggleTask = async (t) => {
    await patch(`/tasks/${t.id}`, { completed: !t.completed });
    refresh();
  };
  const toggleHabit = async (h) => {
    await post("/habits/toggle", { habitId: h.id, date: today });
    refresh();
  };

  const catCount = (c) => (boot.tasks || []).filter((t) => t.category === c).length;
  const foodLogged = !!(boot.food && (boot.food.breakfast || boot.food.lunch || boot.food.dinner || boot.food.snacks));
  const cards = [
    { emoji: "💻", label: "Office", view: "today", sub: `${catCount("office")} tasks today`, bg: "#DBEEFB" },
    { emoji: "🏠", label: "Home", view: "today", sub: `${catCount("home")} tasks today`, bg: "#FCEEDB" },
    { emoji: "🌱", label: "Habits", view: "habits", sub: `${s.habitDone || 0} / ${s.habitTotal || 0} done`, bg: "#E2F0E3" },
    { emoji: "🥗", label: "Food", view: "food", sub: foodLogged ? "logged today ✓" : "what did you eat?", bg: "#FBDFDF" },
    { emoji: "💰", label: "Money", view: "money", sub: boot.money?.tracked ? "tracked today ✓" : "track today", bg: "#F7EFC4" },
    { emoji: "🧖", label: "Self Care", view: "monthly", sub: `${(boot.monthlyGoals || []).length} goals this month`, bg: "#F6E3F1" },
    { emoji: "🎯", label: "Goals", view: "yearly", sub: `${(boot.yearlyGoals || []).length} big dreams`, bg: "#E9E2F6" },
  ];

  const tasks = [...(boot.tasks || [])].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).slice(0, 5);

  return (
    <div className="anim-fade-up space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-[#FDEFF3] via-[#F7F0FA] to-[#EDF5EA] p-7 shadow-card dark:from-[#332B44] dark:via-[#2C2739] dark:to-[#2A3329]">
        <span className="pointer-events-none absolute -right-2 -top-3 select-none text-7xl opacity-25">🌸</span>
        <span className="pointer-events-none absolute bottom-2 right-16 select-none text-4xl opacity-20">☁️</span>
        <p className="text-sm font-semibold text-foreground/60">🌸 {fmtDay(today)}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground md:text-4xl">
          {greeting()}, {boot.name} ♡
        </h1>
        <p className="mt-2 text-sm italic text-foreground/60">&ldquo;{quote}&rdquo;</p>
      </div>

      <SectionCard emoji="🌷" title="Today's Progress" right={<span className="text-sm font-bold text-primary">{pct}%</span>}>
        <Bar value={totalDone} max={totalAll || 1} h="h-4" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            <b className="text-foreground">{s.taskDone || 0} / {s.taskTotal || 0}</b> tasks · <b className="text-foreground">{s.habitDone || 0} / {s.habitTotal || 0}</b> habits
          </span>
          <span>{pct >= 80 ? "✨ you did amazing" : pct >= 40 ? "🌿 lovely progress" : "🌱 every little step counts"}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatChip emoji="🌸" label="weekly goals" value={`${s.weeklyHit || 0} / ${s.weeklyTotal || 0}`} />
          <StatChip emoji="💰" label="money" value={boot.money?.tracked ? "tracked ✓" : "not yet"} />
          <StatChip emoji="🥗" label="food" value={foodLogged ? "logged ✓" : "not yet"} />
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard emoji="☀️" title="Today's Tasks" right={<button type="button" onClick={() => go("today")} className="text-xs font-bold text-primary">view all →</button>}>
          {tasks.length === 0 ? (
            <div className="grid place-items-center gap-2 py-4 text-center">
              <span className="floaty text-3xl">🌤️</span>
              <p className="text-sm text-muted-foreground">Nothing planned yet — add your first task</p>
              <button type="button" onClick={() => onAdd({ type: "task" })} className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">+ add task</button>
            </div>
          ) : (
            <div className="stagger space-y-1">
              {tasks.map((t) => (
                <DashTask key={t.id} t={t} onToggle={toggleTask} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard emoji="🌱" title="Today's Habits" right={<button type="button" onClick={() => go("habits")} className="text-xs font-bold text-primary">view all →</button>}>
          {(boot.habits || []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No habits yet — plant your first one 🌷</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(boot.habits || []).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggleHabit(h)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                    h.done ? "border-transparent bg-[#A8C8A0] text-white shadow-sm" : "border-border/70 bg-background text-foreground/75 hover:border-primary/50"
                  }`}
                >
                  <span>{h.emoji}</span> {h.name} {h.done ? "✓" : "○"}
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {(boot.weeklyGoals || []).length > 0 && (
        <SectionCard emoji="🌸" title="This Week's Goals" right={<button type="button" onClick={() => go("weekly")} className="text-xs font-bold text-primary">view all →</button>}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(boot.weeklyGoals || []).map((g) => {
              const hit = g.count >= (g.target || 1);
              return (
                <div key={g.id} className={`rounded-2xl border p-3 ${hit ? "border-[#A8C8A0]/60 bg-[#A8C8A0]/10" : "border-border/70"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{g.emoji} {g.name}</span>
                    <span className={`shrink-0 text-xs font-bold ${hit ? "text-[#6E9668]" : "text-muted-foreground"}`}>
                      {g.count} / {g.target} {hit ? "✓" : ""}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {Array.from({ length: g.target || 1 }).map((_, i) => (
                      <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < g.count ? "bg-[#A8C8A0]" : "bg-muted ring-1 ring-border"}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      <SectionCard emoji="🎀" title="My Little Corners">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => go(c.view)}
              className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: c.bg }}>
                {c.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">{c.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{c.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function DashTask({ t, onToggle }) {
  const [n, setN] = useState(0);
  return (
    <div className={`relative flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-all ${t.completed ? "opacity-50" : "hover:bg-muted/60"}`}>
      <div className="relative">
        <CuteCheck
          size={22}
          done={t.completed}
          onClick={() => {
            if (!t.completed) setN((x) => x + 1);
            onToggle(t);
          }}
        />
        <Burst id={n} />
      </div>
      <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${t.completed ? "line-through" : ""}`}>{t.title}</span>
    </div>
  );
}
