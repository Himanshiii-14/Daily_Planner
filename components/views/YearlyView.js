"use client";

import { useEffect, useState } from "react";
import { SectionCard, Bar, Btn, Empty, PageHead, StatChip } from "@/components/ui-bits";
import { post, patch, del } from "@/lib/shared";

const shiftYear = (y, n) => String(Number(y) + n);

export default function YearlyView({ boot, refresh, today, onAdd }) {
  const [year, setYear] = useState(today.slice(0, 4));
  const [dash, setDash] = useState(null);
  const [milestoneInput, setMilestoneInput] = useState({});

  useEffect(() => {
    let alive = true;
    fetch(`/api/yearly/dashboard?year=${year}&today=${today}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => alive && setDash(d));
    return () => {
      alive = false;
    };
  }, [year, boot, today]);

  const bump = async (g, n) => {
    await patch(`/yearly/${g.id}`, { progress: Math.max(0, (Number(g.progress) || 0) + n) });
    refresh();
  };

  const toggleMilestone = async (g, m) => {
    await patch(`/yearly/${g.id}`, { milestoneId: m.id, done: !m.done });
    refresh();
  };

  const addMilestone = async (g) => {
    const title = (milestoneInput[g.id] || "").trim();
    if (!title) return;
    await post("/yearly/milestone", { goalId: g.id, title });
    setMilestoneInput((p) => ({ ...p, [g.id]: "" }));
    refresh();
  };

  const removeMilestone = async (g, m) => {
    await del(`/yearly/${g.id}/milestone/${m.id}`);
    refresh();
  };

  const remove = async (g) => {
    if (!confirm(`Delete "${g.name}"?`)) return;
    await del(`/yearly/${g.id}`);
    refresh();
  };

  const elapsedDays = year === today.slice(0, 4)
    ? Math.max(1, Math.round((new Date(`${today}T00:00:00`) - new Date(`${year}-01-01T00:00:00`)) / 86400000) + 1)
    : (Number(year) % 4 === 0 ? 366 : 365);
  const goals = dash?.yearlyGoals || [];

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead
        emoji="✨"
        title={`My ${year}`}
        sub="a year in review — look how consistent you are ♡"
        right={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setYear(shiftYear(year, -1))} className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground hover:bg-muted">‹</button>
            <span className="font-display text-base font-semibold">{year}</span>
            <button type="button" onClick={() => setYear(shiftYear(year, 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground hover:bg-muted">›</button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard emoji="🌱" title="Habits">
          {(dash?.habits || []).length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">No habits yet 🌸</p>
          ) : (
            <div className="space-y-3">
              {(dash.habits || []).map((h) => (
                <div key={h.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold">{h.emoji} {h.name}</span>
                    <span className="text-xs font-bold text-muted-foreground">{h.days} / {elapsedDays} days</span>
                  </div>
                  <Bar value={h.days} max={elapsedDays} h="h-2.5" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard emoji="🌸" title="Monthly Goals">
          {(dash?.monthlyGoals || []).length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">No monthly goals yet 🌸</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(dash.monthlyGoals || []).map((m) => (
                <StatChip key={m.name} emoji={m.emoji} label={m.name} value={`${m.done} / 12 months`} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        emoji="🎯"
        title="Yearly Goals"
        right={<Btn tone="soft" onClick={() => onAdd({ type: "yearly" })}>+ Add yearly goal</Btn>}
      >
        {goals.length === 0 ? (
          <Empty emoji="✨" text="Dream big — read 12 books, learn investing, travel more" />
        ) : (
          <div className="stagger grid gap-4 md:grid-cols-2">
            {goals.map((g) => {
              const max = g.target || 100;
              const val = Number(g.progress) || 0;
              const pct = Math.min(100, Math.round((val / max) * 100));
              const msDone = (g.milestones || []).filter((m) => m.done).length;
              return (
                <div key={g.id} className="group relative rounded-2xl border border-border/70 bg-background p-4">
                  <button type="button" onClick={() => remove(g)} className="absolute right-3 top-3 rounded-full px-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-60 hover:!opacity-100">
                    ✕
                  </button>
                  <h4 className="pr-6 font-display text-base font-bold">{g.name}</h4>
                  {g.description && <p className="mt-0.5 text-xs text-muted-foreground">{g.description}</p>}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{val}{g.target ? ` / ${g.target}` : "%"}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="mt-1"><Bar value={val} max={max} h="h-2.5" /></div>
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" onClick={() => bump(g, 1)} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20">+1</button>
                    <button type="button" onClick={() => bump(g, 5)} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20">+5</button>
                    {g.deadline && <span className="ml-auto self-center text-[11px] text-muted-foreground">📅 {g.deadline}</span>}
                  </div>
                  {(g.milestones || []).length > 0 && (
                    <div className="mt-3 border-t border-border/60 pt-2">
                      <p className="mb-1 text-[11px] font-bold text-muted-foreground">milestones {msDone}/{g.milestones.length}</p>
                      <div className="space-y-1">
                        {g.milestones.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs hover:bg-muted/60">
                            <button type="button" onClick={() => toggleMilestone(g, m)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                              <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${m.done ? "bg-[var(--pop2)] text-[var(--ink)]" : "border border-border bg-card"}`}>{m.done ? "✓" : ""}</span>
                              <span className={m.done ? "line-through opacity-60" : ""}>{m.title}</span>
                            </button>
                            <button type="button" onClick={() => removeMilestone(g, m)} className="text-muted-foreground hover:text-destructive">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    <input
                      value={milestoneInput[g.id] || ""}
                      onChange={(e) => setMilestoneInput((p) => ({ ...p, [g.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addMilestone(g)}
                      placeholder="add a milestone…"
                      className="w-full rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs outline-none ring-ring focus:ring-2"
                    />
                    <button type="button" onClick={() => addMilestone(g)} className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
