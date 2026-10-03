"use client";

import { useEffect, useRef, useState } from "react";
import { SectionCard, PageHead, Empty } from "@/components/ui-bits";
import { addDays, fmtShort } from "@/lib/shared";

export default function Notes({ boot, refresh, today }) {
  const [date, setDate] = useState(today);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);

  const loadList = () => {
    fetch("/api/notes", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setNotes(d.notes || []));
  };

  useEffect(loadList, [boot]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/notes?date=${date}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (alive) setContent(d.note?.content || "");
      });
    return () => {
      alive = false;
    };
  }, [date, boot]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const save = (text) => {
    setContent(text);
    const forDate = date;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ date: forDate, content: text }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      loadList();
      refresh();
    }, 800);
  };

  return (
    <div className="anim-fade-up space-y-5">
      <PageHead emoji="📝" title="Notes" sub="little thoughts, little diary pages ♡" />

      <SectionCard>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDate(addDays(date, -1))} className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground hover:bg-muted">‹</button>
            <span className="font-display text-base font-semibold">{date === today ? "Today" : fmtShort(date)}</span>
            {date !== today && (
              <button type="button" onClick={() => setDate(today)} className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">today</button>
            )}
            <button type="button" onClick={() => setDate(addDays(date, 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground hover:bg-muted">›</button>
          </div>
          {saved && <span className="text-xs font-bold text-[#6E9668]">saved ♡</span>}
        </div>
        <textarea
          rows={7}
          value={content}
          onChange={(e) => save(e.target.value)}
          placeholder="Dear diary… ♡"
          className="w-full resize-none rounded-2xl border border-border bg-background p-4 font-display text-sm italic leading-relaxed outline-none ring-ring focus:ring-2"
        />
      </SectionCard>

      <SectionCard emoji="📚" title="Recent notes">
        {notes.length === 0 ? (
          <Empty emoji="📝" text="No notes yet — write your first little page above ♡" />
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <button
                key={n.id || n.date}
                type="button"
                onClick={() => setDate(n.date)}
                className={`block w-full rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-card ${n.date === date ? "border-primary/50 bg-primary/5" : "border-border/70 bg-background"}`}
              >
                <span className="text-[11px] font-bold text-muted-foreground">{n.date === today ? "today ♡" : n.date}</span>
                <p className="mt-0.5 line-clamp-2 text-sm italic text-foreground/80">{(n.content || "").slice(0, 120) || "…"}</p>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
