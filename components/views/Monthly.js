"use client";

import { useEffect, useState } from "react";
import { SectionCard, CuteCheck, MonthNav, Btn, Empty, PageHead } from "@/components/ui-bits";
import { CATEGORIES, patch, del, fmtShort, pad2 } from "@/lib/shared";

const shiftMonth = (m, n) => {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(y, mm - 1 + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Monthly({ boot, refresh, today, onAdd }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [data, setData] = useState(null);
  const [yearData, setYearData] = useState(null);
  const year = month.slice(0, 4);

  useEffect(() => {
    let alive = true;
    fetch(`/api/monthly?month=${month}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [month, boot]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/monthly/year?year=${year}&today=${today}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => alive && setYearData(d));
    return () => {
      alive = false;
    };
  }, [year, boot, today]);

  const toggle = async (g) => {
    await patch(`/monthly/${g.id}`, { completed: !g.completed });
    refresh();
  };

  const remove = async (g) => {
    if (!confirm(`Delete "${g.name}"?`)) return;
    await del(`/monthly/${g.id}`);
    refresh();
  };

  const goals = data?.goals || [];
  const yearGoals = yearData?.goals || [];

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead
        emoji="🗓️"
        title="Monthly Goals"
        sub="once a month is enough for these little treats ♡"
        right={<Btn tone="soft" onClick={() => onAdd({ type: "monthly" })}>+ Add monthly goal</Btn>}
      />

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">🌸 This month</h3>
          <MonthNav label={month} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
        </div>
        {goals.length === 0 ? (
          <Empty emoji="🧖" text="No goals this month — plan a spa day, a parlour visit, a deep clean…" />
        ) : (
          <div className="stagger space-y-1">
            {goals.map((g) => {
              const meta = CATEGORIES[g.category] || { emoji: "🌸", label: g.category, bg: "#F6E3F1", fg: "#9C64A5" };
              return (
                <div key={g.id} className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all ${g.completed ? "opacity-60" : "hover:bg-muted/60"}`}>
                  <CuteCheck done={g.completed} onClick={() => toggle(g)} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${g.completed ? "line-through" : ""}`}>{g.emoji} {g.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: meta.bg, color: meta.fg }}>
                        {meta.emoji} {meta.label}
                      </span>
                      {g.completed && g.completedAt && <span>done {fmtShort(g.completedAt)} ✓</span>}
                      {g.notes && <span className="truncate">📝 {g.notes}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(g)} className="rounded-full px-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-60 hover:!opacity-100">
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">✨ {year} — all months at a glance</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -12))} className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground hover:bg-muted">‹</button>
            <span className="font-display text-base font-semibold">{year}</span>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 12))} className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground hover:bg-muted">›</button>
          </div>
        </div>
        {yearGoals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Your yearly consistency garden grows here 🌷</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left text-xs font-bold text-muted-foreground">Goal</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-0.5 text-center text-[11px] font-bold text-muted-foreground">{m}</th>
                  ))}
                  <th className="text-right text-xs font-bold text-muted-foreground">/12</th>
                </tr>
              </thead>
              <tbody>
                {yearGoals.map((g) => (
                  <tr key={g.name}>
                    <td className="max-w-32 truncate py-1 pr-2 text-xs font-semibold">{g.emoji} {g.name}</td>
                    {MONTHS.map((_, mi) => {
                      const mm = pad2(mi + 1);
                      const cell = g.months?.[mm];
                      const monthEnd = `${year}-${mm}-${pad2(new Date(Number(year), mi + 1, 0).getDate())}`;
                      let content = "·";
                      let cls = "text-muted-foreground/30";
                      if (cell?.completed) {
                        content = "✓";
                        cls = "bg-[#A8C8A0] text-white";
                      } else if (cell && monthEnd < today) {
                        content = "✕";
                        cls = "bg-rose-100 text-rose-400 dark:bg-[#3A2F3F] dark:text-rose-300/70";
                      } else if (cell) {
                        content = "○";
                        cls = "bg-muted text-muted-foreground";
                      }
                      return (
                        <td key={mm} className="py-1 text-center">
                          <span className={`inline-grid h-7 w-9 place-items-center rounded-lg text-xs font-bold ${cls}`}>{content}</span>
                        </td>
                      );
                    })}
                    <td className="text-right text-xs font-bold text-foreground">{g.done}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
