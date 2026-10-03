"use client";

import { useEffect, useRef, useState } from "react";
import { SectionCard, CuteCheck, PageHead, MonthNav, Bar } from "@/components/ui-bits";
import { addDays, pad2 } from "@/lib/shared";

const shiftMonth = (m, n) => {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(y, mm - 1 + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

export default function MoneyView({ boot, refresh, today }) {
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [monthData, setMonthData] = useState({ entries: [], stats: null });
  const [form, setForm] = useState({ tracked: false, amount: "", notes: "" });
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/money?month=${month}&today=${today}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => alive && setMonthData({ entries: d.entries || [], stats: d.stats || null }));
    return () => {
      alive = false;
    };
  }, [month, boot, today]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/money?date=${date}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const e = d.entry || {};
        setForm({
          tracked: !!e.tracked,
          amount: e.amount === undefined || e.amount === null ? "" : String(e.amount),
          notes: e.notes || "",
        });
      });
    return () => {
      alive = false;
    };
  }, [date, boot]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const save = (next) => {
    setForm(next);
    const forDate = date;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch("/api/money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ date: forDate, ...next, amount: next.amount === "" ? "" : Number(next.amount) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      refresh();
    }, 600);
  };

  const trackedSet = new Set((monthData.entries || []).filter((e) => e.tracked).map((e) => e.date));
  const st = monthData.stats;
  const days = Array.from(
    { length: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate() },
    (_, i) => `${month}-${pad2(i + 1)}`
  );
  const firstDow = days.length ? (new Date(`${days[0]}T00:00:00`).getDay() + 6) % 7 : 0;

  const toggleDay = async (d) => {
    if (d > today) return;
    const isTracked = trackedSet.has(d);
    await fetch("/api/money", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ date: d, tracked: !isTracked }),
    });
    if (d === date) setForm((f) => ({ ...f, tracked: !isTracked }));
    refresh();
  };

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead emoji="💰" title="Money" sub="the little daily habit — did I track my money today? ♡" />

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDate(addDays(date, -1))} className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground hover:bg-muted">‹</button>
            <span className="font-display text-base font-semibold">{date === today ? "Today" : date}</span>
            {date !== today && (
              <button type="button" onClick={() => setDate(today)} className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">today</button>
            )}
            <button type="button" onClick={() => setDate(addDays(date, 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground hover:bg-muted">›</button>
          </div>
          {saved && <span className="text-xs font-bold text-[var(--ink)]">saved ♡</span>}
        </div>

        <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-gradient-to-r from-[#F7EFC4]/50 to-[#FDEBD3]/50 p-5 dark:from-[#3A3428] dark:to-[#3D3222]">
          <CuteCheck size={44} done={form.tracked} color="#E7C86D" onClick={() => save({ ...form, tracked: !form.tracked })} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">{form.tracked ? "Tracked today ✓" : "Did I track my money today?"}</p>
            <p className="text-xs text-muted-foreground">one tiny checkmark keeps the habit alive 🌷</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">spending (₹)</label>
            <input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => save({ ...form, amount: e.target.value })}
              placeholder="420"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">notes</label>
            <input
              value={form.notes}
              onChange={(e) => save({ ...form, notes: e.target.value })}
              placeholder="Coffee + groceries"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">📊 {month}</h3>
          <MonthNav label={month} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
        </div>

        {st && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                days tracked: <b className="text-foreground">{st.tracked} / {st.elapsed}</b>
              </span>
              <span className="text-muted-foreground">
                total spent: <b className="text-foreground">₹{st.total}</b>
              </span>
            </div>
            <Bar value={st.tracked} max={st.elapsed || 1} h="h-2.5" from="var(--pop2)" to="var(--pop)" />
          </div>
        )}

        <div className="grid grid-cols-7 gap-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-bold text-muted-foreground/80">{d}</div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {days.map((d) => {
            const done = trackedSet.has(d);
            const future = d > today;
            const isToday = d === today;
            let cls = "cursor-default bg-muted/50 text-muted-foreground/40";
            if (done) cls = "border-[2px] border-[var(--ink)] bg-[var(--pop2)] text-[var(--ink)] hover:opacity-80";
            else if (isToday) cls = "bg-primary/15 text-primary ring-2 ring-primary/40";
            else if (!future) cls = "bg-rose-100/80 text-rose-400 hover:scale-105 dark:bg-[#3A2F3F] dark:text-rose-300/60";
            return (
              <button
                key={d}
                type="button"
                disabled={future}
                onClick={() => toggleDay(d)}
                title={d}
                className={`grid aspect-square place-items-center rounded-xl text-xs font-bold transition-all ${cls}`}
              >
                {done ? "✓" : new Date(`${d}T00:00:00`).getDate()}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">tap any past day to fix it — the monthly stats update instantly ♡</p>
      </SectionCard>
    </div>
  );
}
