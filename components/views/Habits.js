"use client";

import { useEffect, useState } from "react";
import { SectionCard, CuteCheck, Heatmap, MonthNav, Btn, Empty, PageHead, StatChip } from "@/components/ui-bits";
import { post, del, pad2 } from "@/lib/shared";

const shiftMonth = (m, n) => {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(y, mm - 1 + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

export default function Habits({ boot, refresh, today, onAdd }) {
  const [habitId, setHabitId] = useState(null);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [data, setData] = useState(null);

  useEffect(() => {
    const ids = (boot.habits || []).map((h) => h.id);
    if (!ids.includes(habitId)) setHabitId(ids[0] || null);
  }, [boot, habitId]);

  useEffect(() => {
    if (!habitId) {
      setData(null);
      return undefined;
    }
    let alive = true;
    fetch(`/api/habits/month?habit=${habitId}&month=${month}&today=${today}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => alive && setData(d.error ? null : d));
    return () => {
      alive = false;
    };
  }, [habitId, month, boot, today]);

  const toggleToday = async (h) => {
    await post("/habits/toggle", { habitId: h.id, date: today });
    refresh();
  };

  const toggleDay = async (d) => {
    if (!habitId) return;
    await post("/habits/toggle", { habitId, date: d });
    refresh();
  };

  const removeHabit = async (h) => {
    if (!confirm(`Delete "${h.name}" and all its history?`)) return;
    await del(`/habits/${h.id}`);
    refresh();
  };

  const st = data?.stats || {};

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead
        emoji="🌱"
        title="Habits"
        sub="little things I do every day — tap the heatmap to fix a missed day ♡"
        right={<Btn tone="soft" onClick={() => onAdd({ type: "habit" })}>+ Add habit</Btn>}
      />

      <SectionCard emoji="✅" title="Today" right={<span className="text-xs text-muted-foreground">{boot.stats?.habitDone || 0} / {boot.stats?.habitTotal || 0}</span>}>
        {(boot.habits || []).length === 0 ? (
          <Empty emoji="🌱" text="No habits yet — what do you want to do every day?" />
        ) : (
          <div className="space-y-1">
            {(boot.habits || []).map((h) => (
              <div key={h.id} className={`group flex items-center gap-3 rounded-2xl px-3 py-2 transition-all ${h.done ? "opacity-60" : "hover:bg-muted/60"}`}>
                <CuteCheck done={h.done} onClick={() => toggleToday(h)} />
                <span className={`flex-1 text-sm font-semibold ${h.done ? "line-through" : ""}`}>
                  {h.emoji} {h.name}
                </span>
                <button type="button" onClick={() => setHabitId(h.id)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${habitId === h.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                  history
                </button>
                <button type="button" onClick={() => removeHabit(h)} className="rounded-full px-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-60 hover:!opacity-100">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {habitId && data?.dates && (
        <SectionCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold">
                {data.habit?.emoji} {data.habit?.name}
              </h3>
              <p className="text-xs text-muted-foreground">monthly tracker</p>
            </div>
            <MonthNav label={data.month} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <StatChip emoji="🌸" label="completed" value={`${st.completed || 0} / ${st.elapsed || 0} days`} />
            <StatChip emoji="📊" label="success" value={`${st.pct || 0}%`} />
            <StatChip emoji="🔥" label="streak" value={`${st.streak || 0} days`} />
            <StatChip emoji="⭐" label="best" value={`${st.best || 0} days`} />
          </div>
          <Heatmap dates={data.dates || []} doneSet={new Set(data.done || [])} today={today} onToggle={toggleDay} />
        </SectionCard>
      )}
    </div>
  );
}
