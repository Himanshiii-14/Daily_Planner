"use client";

import { useEffect, useState } from "react";
import { SectionCard, MonthNav, Btn, Empty, PageHead, Dots } from "@/components/ui-bits";
import { post, del, fmtShort, pad2 } from "@/lib/shared";

const shiftMonth = (m, n) => {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(y, mm - 1 + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

export default function Weekly({ boot, refresh, today, onAdd }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/weekly?month=${month}&today=${today}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [month, boot, today]);

  const toggleToday = async (g) => {
    await post("/weekly/toggle", { goalId: g.id, date: today });
    refresh();
  };

  const remove = async (g) => {
    if (!confirm(`Delete "${g.name}" and its history?`)) return;
    await del(`/weekly/${g.id}`);
    refresh();
  };

  const goals = data?.goals || [];
  const weeks = data?.weeks || [];
  const count = data?.thisWeek || {};
  const todayCount = data?.todayCount || {};

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead
        emoji="🌸"
        title="Weekly Goals"
        sub="not every day — just a few times a week is lovely ♡"
        right={<Btn tone="soft" onClick={() => onAdd({ type: "weekly" })}>+ Add weekly goal</Btn>}
      />

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">🗓️ Week of {fmtShort(boot.weekStart || today)}</h3>
          <span className="text-xs text-muted-foreground">tap + to mark an occurrence for today</span>
        </div>
        {goals.length === 0 ? (
          <Empty emoji="🌸" text="No weekly goals yet — e.g. Wash hair, 2 times per week" />
        ) : (
          <div className="space-y-2">
            {goals.map((g) => {
              const c = count[g.id] || 0;
              const hit = c >= (g.target || 1);
              const markedToday = (todayCount[g.id] || 0) > 0;
              return (
                <div key={g.id} className={`group flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${hit ? "border-[#A8C8A0]/60 bg-[#A8C8A0]/10" : "border-border/70"}`}>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{g.emoji} {g.name}</span>
                  <Dots count={c} target={g.target || 1} />
                  <span className={`text-xs font-bold ${hit ? "text-[#6E9668]" : "text-muted-foreground"}`}>
                    {c} / {g.target} {hit ? "✓" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleToday(g)}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all active:scale-95 ${markedToday ? "bg-[#A8C8A0] text-white" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                  >
                    {markedToday ? "✓ today" : "+ today"}
                  </button>
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
          <h3 className="font-display text-lg font-semibold">📊 Monthly overview</h3>
          <MonthNav label={month} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
        </div>
        {goals.length === 0 || weeks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Your weekly rhythm will bloom here 🌷</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left text-xs font-bold text-muted-foreground">Goal</th>
                  {weeks.map((w, i) => (
                    <th key={w.start} className="px-1 text-center text-[11px] font-bold text-muted-foreground">
                      W{i + 1}
                      <span className="block font-medium opacity-70">{w.start.slice(8)}–{w.end.slice(8)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g.id}>
                    <td className="max-w-36 truncate py-1 pr-2 text-xs font-semibold">{g.emoji} {g.name}</td>
                    {weeks.map((w) => {
                      const c = (data.count || {})[`${g.id}|${w.start}`] || 0;
                      const hit = c >= (g.target || 1);
                      const weekOver = w.end < today;
                      const cls = hit
                        ? "bg-[#A8C8A0] text-white"
                        : weekOver
                          ? "bg-rose-100 text-rose-400 dark:bg-[#3A2F3F] dark:text-rose-300/70"
                          : "bg-muted text-muted-foreground";
                      return (
                        <td key={w.start} className="py-1 text-center">
                          <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>
                            {c}/{g.target} {hit ? "✓" : weekOver ? "✕" : ""}
                          </span>
                        </td>
                      );
                    })}
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
