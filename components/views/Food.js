"use client";

import { useEffect, useRef, useState } from "react";
import { SectionCard, PageHead, MonthNav } from "@/components/ui-bits";
import { MOODS, addDays, compressImage, pad2 } from "@/lib/shared";

const shiftMonth = (m, n) => {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(y, mm - 1 + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

const MEALS = [
  { key: "breakfast", emoji: "🥣", label: "Breakfast", ph: "Oats + banana" },
  { key: "lunch", emoji: "🍱", label: "Lunch", ph: "Rice + dal + vegetables" },
  { key: "snacks", emoji: "🍎", label: "Snacks", ph: "Tea + biscuits" },
  { key: "dinner", emoji: "🍲", label: "Dinner", ph: "Paneer + salad" },
];

export default function Food({ boot, refresh, today }) {
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [monthData, setMonthData] = useState([]);
  const [form, setForm] = useState({ breakfast: "", lunch: "", snacks: "", dinner: "", notes: "", mood: "😊", photo: "" });
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    let alive = true;
    fetch(`/api/food?month=${month}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => alive && setMonthData(d.entries || []));
    return () => {
      alive = false;
    };
  }, [month, boot]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/food?date=${date}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const e = d.entry || {};
        setForm({
          breakfast: e.breakfast || "",
          lunch: e.lunch || "",
          snacks: e.snacks || "",
          dinner: e.dinner || "",
          notes: e.notes || "",
          mood: e.mood || "😊",
          photo: e.photo || "",
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
      await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ date: forDate, ...next }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      refresh();
    }, 700);
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    save({ ...formRef.current, photo: dataUrl });
  };

  const days = Array.from(
    { length: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate() },
    (_, i) => `${month}-${pad2(i + 1)}`
  );
  const firstDow = days.length ? (new Date(`${days[0]}T00:00:00`).getDay() + 6) % 7 : 0;
  const journaled = monthData.filter((e) => e.breakfast || e.lunch || e.snacks || e.dinner).length;

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead emoji="🥗" title="Food Diary" sub="a cozy little food journal — no calories, just memories ♡" />

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
          {saved && <span className="text-xs font-bold text-[#6E9668]">saved ♡</span>}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {MEALS.map((m) => (
            <div key={m.key}>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">{m.emoji} {m.label}</label>
              <textarea
                rows={2}
                placeholder={m.ph}
                value={form[m.key]}
                onChange={(e) => save({ ...form, [m.key]: e.target.value })}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div>
            <p className="mb-1 text-xs font-bold text-muted-foreground">mood</p>
            <div className="flex gap-1">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => save({ ...form, mood: m })}
                  className={`grid h-9 w-9 place-items-center rounded-xl border text-lg transition-all hover:scale-110 ${form.mood === m ? "border-primary bg-primary/10" : "border-border/60 bg-background"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-40 flex-1">
            <p className="mb-1 text-xs font-bold text-muted-foreground">notes</p>
            <input
              value={form.notes}
              onChange={(e) => save({ ...form, notes: e.target.value })}
              placeholder="Felt light and happy ♡"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {form.photo ? (
            <div className="relative">
              <img src={form.photo} alt="meal" className="h-20 w-20 rounded-2xl object-cover" />
              <button type="button" onClick={() => save({ ...form, photo: "" })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-[10px] text-white">
                ✕
              </button>
            </div>
          ) : (
            <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border text-center text-[10px] font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary">
              📷 add
              <br />
              photo
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          )}
          <p className="text-xs text-muted-foreground">photos make the diary extra cute 🌸</p>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">📖 Monthly journal</h3>
          <MonthNav label={month} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{journaled} days journaled this month · tap a day</p>
        <div className="grid grid-cols-7 gap-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-bold text-muted-foreground/80">{d}</div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {days.map((d) => {
            const e = monthData.find((x) => x.date === d);
            const logged = !!(e && (e.breakfast || e.lunch || e.snacks || e.dinner));
            const sel = d === date;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDate(d);
                  if (d.slice(0, 7) !== month) setMonth(d.slice(0, 7));
                }}
                className={`grid aspect-square place-items-center rounded-xl text-xs font-bold transition-all hover:scale-105 ${
                  sel ? "bg-primary text-white shadow-sm" : logged ? "bg-[#A8C8A0]/25 text-foreground" : "bg-muted/60 text-muted-foreground"
                }`}
              >
                <span>{new Date(`${d}T00:00:00`).getDate()}</span>
                {e?.mood && <span className="text-[9px] leading-none">{e.mood}</span>}
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
