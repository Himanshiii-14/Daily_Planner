"use client";

import { useState } from "react";
import { SectionCard, Bar, CuteCheck, Burst, Btn } from "@/components/ui-bits";
import { CATEGORIES, PRIORITIES, fmtDay, post, patch, del } from "@/lib/shared";
import { useTheme } from "@/components/theme";

function TaskRow({ t, onToggle, onDelete }) {
  const [n, setN] = useState(0);
  return (
    <div className={`group relative flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-all ${t.completed ? "opacity-50" : "hover:bg-muted/60"}`}>
      <div className="relative pt-0.5">
        <CuteCheck
          done={t.completed}
          onClick={() => {
            if (!t.completed) setN((x) => x + 1);
            onToggle(t);
          }}
        />
        <Burst id={n} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold leading-snug ${t.completed ? "line-through" : ""}`}>{t.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {t.time && <span>⏰ {t.time}</span>}
          {t.priority && t.priority !== "none" && (
            <span style={{ color: (PRIORITIES[t.priority] || {}).color }}>● {PRIORITIES[t.priority]?.label}</span>
          )}
          {t.notes && <span className="max-w-full truncate">📝 {t.notes}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(t)}
        className="shrink-0 rounded-full px-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

export default function Today({ boot, refresh, today, onAdd }) {
  const { theme, current } = useTheme();
  const toggle = async (t) => {
    await patch(`/tasks/${t.id}`, { completed: !t.completed });
    refresh();
  };
  const remove = async (t) => {
    await del(`/tasks/${t.id}`);
    refresh();
  };
  const toggleHabit = async (h) => {
    await post("/habits/toggle", { habitId: h.id, date: today });
    refresh();
  };

  const byCat = {};
  (boot.tasks || []).forEach((t) => {
    (byCat[t.category] = byCat[t.category] || []).push(t);
  });
  const shown = ["office", "home", "personal"].filter((c) => (byCat[c] || []).length > 0);
  const others = Object.keys(byCat).filter((c) => !["office", "home", "personal"].includes(c));
  const total = (boot.stats?.taskTotal || 0) + (boot.stats?.habitTotal || 0);
  const done = (boot.stats?.taskDone || 0) + (boot.stats?.habitDone || 0);

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">☀️ Today&apos;s To-Do</h1>
          <p className="mt-1 text-sm text-muted-foreground">{fmtDay(today)} · what do I need to do today?</p>
        </div>
        <div className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
          {done} / {total} complete
        </div>
      </div>
      <Bar value={done} max={total || 1} />

      <SectionCard emoji="🌱" title="Today's Habits" right={<span className="text-xs text-muted-foreground">{boot.stats?.habitDone || 0} / {boot.stats?.habitTotal || 0}</span>}>
        {(boot.habits || []).length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">No habits yet — add one with the + button 🌸</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(boot.habits || []).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHabit(h)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                  h.done
                    ? "border-transparent bg-[var(--pop2)] text-[var(--ink)] shadow-sm"
                    : "border-border/70 bg-background text-foreground/75 hover:border-primary/50"
                }`}
              >
                <span>{h.emoji}</span> {h.name} {h.done ? current.check : theme === "galaxy" ? "🌙" : "○"}
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      {shown.length === 0 && others.length === 0 && (
        <SectionCard>
          <div className="grid place-items-center gap-3 py-6 text-center">
            <span className="floaty text-4xl">☀️</span>
            <p className="text-sm text-muted-foreground">A clean page — add your first task for today ♡</p>
            <Btn tone="soft" onClick={() => onAdd({ type: "task" })}>+ Add task</Btn>
          </div>
        </SectionCard>
      )}

      {[...shown, ...others].map((c) => {
        const meta = CATEGORIES[c] || { emoji: "🌸", label: c };
        return (
          <SectionCard
            key={c}
            emoji={meta.emoji}
            title={meta.label}
            right={
              <button type="button" onClick={() => onAdd({ type: "task", category: c })} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary transition hover:bg-primary/20">
                + add
              </button>
            }
          >
            <div className="stagger space-y-1">
              {(byCat[c] || []).map((t) => (
                <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={remove} />
              ))}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
