"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Btn } from "@/components/ui-bits";
import { CATEGORIES, EMOJI_ROW, PRIORITIES } from "@/lib/shared";

const TYPES = [
  { id: "task", emoji: "☀️", label: "Daily Task" },
  { id: "habit", emoji: "🌱", label: "Daily Habit" },
  { id: "weekly", emoji: "🌸", label: "Weekly Goal" },
  { id: "monthly", emoji: "🗓️", label: "Monthly Goal" },
  { id: "yearly", emoji: "✨", label: "Yearly Goal" },
  { id: "food", emoji: "🥗", label: "Food Entry" },
  { id: "money", emoji: "💰", label: "Money Entry" },
  { id: "note", emoji: "📝", label: "Note" },
];

const ROUTES = {
  task: "/tasks",
  habit: "/habits",
  weekly: "/weekly",
  monthly: "/monthly",
  yearly: "/yearly",
  food: "/food",
  money: "/money",
  note: "/notes",
};

export default function AddModal({ open, onClose, onSaved, today, preset }) {
  const [type, setType] = useState("task");
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    const t = preset?.type || "task";
    setType(t);
    setErr("");
    const base = { date: today, month: today.slice(0, 7) };
    if (t === "task") setF({ ...base, title: "", category: preset?.category || "personal", priority: "none", time: "", notes: "" });
    else if (t === "habit") setF({ name: "", emoji: "🌱" });
    else if (t === "weekly") setF({ name: "", emoji: "🌸", target: 2 });
    else if (t === "monthly") setF({ ...base, name: "", emoji: "🌸", category: "selfcare", notes: "" });
    else if (t === "yearly") setF({ name: "", description: "", category: "goals", target: "", deadline: "", notes: "" });
    else if (t === "food") setF({ ...base, breakfast: "", lunch: "", snacks: "", dinner: "", notes: "", mood: "😊", photo: "" });
    else if (t === "money") setF({ ...base, tracked: true, amount: "", notes: "" });
    else if (t === "note") setF({ ...base, content: "" });
  }, [open, preset, today]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e?.target ? e.target.value : e }));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api${ROUTES[type]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(f),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "fail");
      onSaved && onSaved();
      onClose();
    } catch (e) {
      setErr(e.message === "fail" ? "Could not save — please try again" : e.message || "Could not save — please try again");
    }
    setBusy(false);
  };

  const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground";
  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

  const EmojiPick = () => (
    <div className="flex flex-wrap gap-1.5">
      {EMOJI_ROW.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => setF((p) => ({ ...p, emoji: e }))}
          className={`grid h-9 w-9 place-items-center rounded-xl border text-lg transition-all hover:scale-110 ${
            f.emoji === e ? "border-primary bg-primary/15" : "border-border/70 bg-background"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[1.6rem] bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">✨ Add something lovely</DialogTitle>
        </DialogHeader>

        {!preset?.type && (
          <div className="mb-2 grid grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`grid place-items-center gap-1 rounded-2xl border px-1 py-3 text-center text-[11px] font-bold transition-all hover:-translate-y-0.5 ${
                  type === t.id ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background text-foreground/70"
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {type === "task" && (
          <div className="space-y-3">
            <div>
              <label className={label}>What needs doing?</label>
              <Input className={input} placeholder="e.g. Finish Teams integration" value={f.title || ""} onChange={set("title")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Category</label>
                <select className={input} value={f.category || "personal"} onChange={set("category")}>
                  {Object.entries(CATEGORIES).map(([k, c]) => (
                    <option key={k} value={k}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Priority</label>
                <select className={input} value={f.priority || "none"} onChange={set("priority")}>
                  {Object.entries(PRIORITIES).map(([k, p]) => (
                    <option key={k} value={k}>{p.label === "—" ? "None" : p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Time (optional)</label>
                <Input type="time" className={input} value={f.time || ""} onChange={set("time")} />
              </div>
              <div>
                <label className={label}>Date</label>
                <Input type="date" className={input} value={f.date || ""} onChange={set("date")} />
              </div>
            </div>
            <div>
              <label className={label}>Notes (optional)</label>
              <Textarea rows={2} className={input} value={f.notes || ""} onChange={set("notes")} />
            </div>
          </div>
        )}

        {type === "habit" && (
          <div className="space-y-3">
            <div>
              <label className={label}>Habit name</label>
              <Input className={input} placeholder="e.g. Drink enough water" value={f.name || ""} onChange={set("name")} />
            </div>
            <EmojiPick />
          </div>
        )}

        {type === "weekly" && (
          <div className="space-y-3">
            <div>
              <label className={label}>Goal name</label>
              <Input className={input} placeholder="e.g. Wash hair" value={f.name || ""} onChange={set("name")} />
            </div>
            <EmojiPick />
            <div>
              <label className={label}>Target — times per week</label>
              <Input type="number" min={1} max={7} className={input} value={f.target ?? ""} onChange={set("target")} />
            </div>
          </div>
        )}

        {type === "monthly" && (
          <div className="space-y-3">
            <div>
              <label className={label}>Goal name</label>
              <Input className={input} placeholder="e.g. Go to spa" value={f.name || ""} onChange={set("name")} />
            </div>
            <EmojiPick />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Category</label>
                <select className={input} value={f.category || "selfcare"} onChange={set("category")}>
                  {Object.entries(CATEGORIES).map(([k, c]) => (
                    <option key={k} value={k}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Month</label>
                <Input type="month" className={input} value={f.month || ""} onChange={set("month")} />
              </div>
            </div>
            <div>
              <label className={label}>Notes (optional)</label>
              <Textarea rows={2} className={input} value={f.notes || ""} onChange={set("notes")} />
            </div>
          </div>
        )}

        {type === "yearly" && (
          <div className="space-y-3">
            <div>
              <label className={label}>Goal name</label>
              <Input className={input} placeholder="e.g. Read 12 books" value={f.name || ""} onChange={set("name")} />
            </div>
            <div>
              <label className={label}>Description</label>
              <Textarea rows={2} className={input} value={f.description || ""} onChange={set("description")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Target (optional)</label>
                <Input type="number" min={1} className={input} value={f.target || ""} onChange={set("target")} />
              </div>
              <div>
                <label className={label}>Deadline (optional)</label>
                <Input type="date" className={input} value={f.deadline || ""} onChange={set("deadline")} />
              </div>
            </div>
          </div>
        )}

        {type === "food" && (
          <div className="space-y-3">
            <div>
              <label className={label}>Date</label>
              <Input type="date" className={input} value={f.date || ""} onChange={set("date")} />
            </div>
            <div>
              <label className={label}>🥣 Breakfast</label>
              <Input className={input} placeholder="Oats + banana" value={f.breakfast || ""} onChange={set("breakfast")} />
            </div>
            <div>
              <label className={label}>🍱 Lunch</label>
              <Input className={input} placeholder="Rice + dal + veggies" value={f.lunch || ""} onChange={set("lunch")} />
            </div>
            <div>
              <label className={label}>🍎 Snacks</label>
              <Input className={input} value={f.snacks || ""} onChange={set("snacks")} />
            </div>
            <div>
              <label className={label}>🍲 Dinner</label>
              <Input className={input} placeholder="Paneer + salad" value={f.dinner || ""} onChange={set("dinner")} />
            </div>
          </div>
        )}

        {type === "money" && (
          <div className="space-y-3">
            <div>
              <label className={label}>Date</label>
              <Input type="date" className={input} value={f.date || ""} onChange={set("date")} />
            </div>
            <div>
              <label className={label}>Today&apos;s spending (₹)</label>
              <Input type="number" min={0} className={input} placeholder="420" value={f.amount || ""} onChange={set("amount")} />
            </div>
            <div>
              <label className={label}>Notes</label>
              <Input className={input} placeholder="Coffee + groceries" value={f.notes || ""} onChange={set("notes")} />
            </div>
          </div>
        )}

        {type === "note" && (
          <div>
            <label className={label}>Note for {f.date}</label>
            <Textarea rows={4} className={input} placeholder="Dear diary… ♡" value={f.content || ""} onChange={set("content")} />
          </div>
        )}

        {err && <p className="mt-2 text-sm font-semibold text-destructive">{err}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Btn tone="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save ♡"}</Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
