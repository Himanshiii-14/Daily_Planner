"use client";

import { useEffect, useState } from "react";
import { SectionCard, CuteCheck, PageHead, MonthNav } from "@/components/ui-bits";
import { post, patch, del, fmtDay, pad2 } from "@/lib/shared";

const shiftMonth = (m, n) => {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(y, mm - 1 + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

export default function CalendarView({ boot, refresh, today }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [day, setDay] = useState(null);
  const [monthTasks, setMonthTasks] = useState([]);
  const [monthFood, setMonthFood] = useState([]);
  const [monthMoney, setMonthMoney] = useState([]);
  const [quick, setQuick] = useState("");

  useEffect(() => {
    fetch(`/api/tasks?month=${month}`, { credentials: "same-origin" }).then((r) => r.json()).then((d) => setMonthTasks(d.tasks || []));
  }, [month, boot]);
  useEffect(() => {
    fetch(`/api/food?month=${month}`, { credentials: "same-origin" }).then((r) => r.json()).then((d) => setMonthFood(d.entries || []));
  }, [month, boot]);
  useEffect(() => {
    fetch(`/api/money?month=${month}&today=${today}`, { credentials: "same-origin" }).then((r) => r.json()).then((d) => setMonthMoney(d.entries || []));
  }, [month, boot, today]);
  useEffect(() => {
    fetch(`/api/day?date=${selected}`, { credentials: "same-origin" }).then((r) => r.json()).then((d) => setDay(d));
  }, [selected, boot]);

  const days = Array.from(
    { length: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate() },
    (_, i) => `${month}-${pad2(i + 1)}`
  );
  const firstDow = days.length ? (new Date(`${days[0]}T00:00:00`).getDay() + 6) % 7 : 0;

  const addQuick = async () => {
    if (!quick.trim()) return;
    await post("/tasks", { title: quick, date: selected, category: "personal" });
    setQuick("");
    refresh();
  };

  const foodOf = (d) => monthFood.find((e) => e.date === d && (e.breakfast || e.lunch || e.snacks || e.dinner));
  const moneyOf = (d) => monthMoney.find((e) => e.date === d && e.tracked);
  const tasksOf = (d) => monthTasks.filter((t) => t.date === d);

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead emoji="📅" title="Calendar" sub="click any day — everything about it lives here ♡" />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <SectionCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">🗓️ Month</h3>
            <MonthNav label={month} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="pb-1 text-center text-[11px] font-bold text-muted-foreground/80">{d}</div>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {days.map((d) => {
              const ts = tasksOf(d);
              const isSel = d === selected;
              const isToday = d === today;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelected(d)}
                  className={`grid aspect-square place-items-center gap-0.5 rounded-xl text-xs font-bold transition-all hover:scale-105 ${
                    isSel ? "bg-primary text-white shadow-sm" : isToday ? "bg-primary/10 text-primary ring-1 ring-primary/40" : "bg-muted/50 text-foreground/70"
                  }`}
                >
                  <span>{new Date(`${d}T00:00:00`).getDate()}</span>
                  <span className="flex h-2 items-center gap-0.5">
                    {ts.length > 0 && <i className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-white" : "bg-[#E8A0B4]"}`} />}
                    {foodOf(d) && <i className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-white/80" : "bg-[#F2A65A]"}`} />}
                    {moneyOf(d) && <i className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-white/70" : "bg-[#7FA8D9]"}`} />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#E8A0B4]" /> tasks</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#F2A65A]" /> food</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#7FA8D9]" /> money</span>
          </div>
        </SectionCard>

        <SectionCard>
          {!day ? (
            <p className="py-6 text-center text-sm text-muted-foreground">pick a day 🌸</p>
          ) : (
            <div>
              <h3 className="font-display text-xl font-bold">📅 {fmtDay(day.date)}</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">☀️ Tasks</p>
                  {(day.tasks || []).length === 0 && <p className="text-sm text-muted-foreground">nothing planned 🌸</p>}
                  <div className="space-y-1">
                    {(day.tasks || []).map((t) => (
                      <DayTask
                        key={t.id}
                        t={t}
                        onToggle={async () => { await patch(`/tasks/${t.id}`, { completed: !t.completed }); refresh(); }}
                        onDelete={async () => { await del(`/tasks/${t.id}`); refresh(); }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <input
                      value={quick}
                      onChange={(e) => setQuick(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addQuick()}
                      placeholder="quick add task…"
                      className="w-full rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs outline-none ring-ring focus:ring-2"
                    />
                    <button type="button" onClick={addQuick} className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">+</button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">🌱 Habits</p>
                  {(day.habits || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">no habits yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(day.habits || []).map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={async () => {
                            await post("/habits/toggle", { habitId: h.id, date: day.date });
                            refresh();
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${h.done ? "border-transparent bg-[#A8C8A0] text-white" : "border-border/70 bg-background text-foreground/70"}`}
                        >
                          {h.emoji} {h.name} {h.done ? "✓" : "○"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">🥗 Food</p>
                  {day.food && (day.food.breakfast || day.food.lunch || day.food.snacks || day.food.dinner) ? (
                    <div className="space-y-1 text-sm">
                      {day.food.breakfast && <p>🥣 {day.food.breakfast}</p>}
                      {day.food.lunch && <p>🍱 {day.food.lunch}</p>}
                      {day.food.snacks && <p>🍎 {day.food.snacks}</p>}
                      {day.food.dinner && <p>🍲 {day.food.dinner}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">nothing logged 🌸</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">💰 Money</p>
                  {day.money?.tracked ? (
                    <p className="text-sm">
                      ✓ tracked{day.money.amount !== "" && day.money.amount !== undefined && day.money.amount !== null ? ` · ₹${day.money.amount}` : ""}
                      {day.money.notes ? ` — ${day.money.notes}` : ""}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">not tracked</p>
                  )}
                </div>

                {(day.weeklyGoals || []).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">🌸 Weekly goals done</p>
                    <div className="flex flex-wrap gap-1.5">
                      {day.weeklyGoals.map((g) => (
                        <span key={g.id} className="rounded-full bg-[#A8C8A0]/20 px-3 py-1 text-xs font-semibold text-[#6E9668]">
                          {g.emoji} {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">📝 Note</p>
                  <p className={`text-sm italic ${day.note ? "" : "text-muted-foreground"}`}>{day.note || "nothing written 🌸"}</p>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function DayTask({ t, onToggle, onDelete }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-all ${t.completed ? "opacity-50" : "hover:bg-muted/60"}`}>
      <CuteCheck size={22} done={t.completed} onClick={onToggle} />
      <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${t.completed ? "line-through" : ""}`}>{t.title}</span>
      <button type="button" onClick={onDelete} className="rounded-full px-1.5 text-muted-foreground opacity-40 hover:opacity-100">✕</button>
    </div>
  );
}
