"use client";

import { useTheme } from "@/components/theme";

export function CuteCheck({ done, onClick, size = 26, color = "var(--pop2)" }) {
  const { current } = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      className={`relative grid shrink-0 place-items-center rounded-[10px] border-[2.5px] border-[var(--ink)] transition-all duration-300 active:scale-90 ${
        done ? "shadow-[2px_2px_0_var(--ink)]" : "bg-[var(--paper)] hover:scale-110 hover:bg-[var(--pop2)]"
      }`}
      style={{ width: size, height: size, background: done ? color : undefined }}
    >
      {done && (
        <span key={String(done)} className="anim-pop leading-none" style={{ fontSize: size * 0.62 }}>
          {current.check}
        </span>
      )}
    </button>
  );
}

export function Burst({ id }) {
  const { current } = useTheme();
  if (!id) return null;
  return (
    <span key={id} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <span className="cheer">{current.cheer}</span>
      {current.petals.map((p, i) => (
        <span
          key={i}
          className="petal text-[11px]"
          style={{ "--tx": `${(i - 2) * 15}px`, animationDelay: `${i * 45}ms` }}
        >
          {p}
        </span>
      ))}
    </span>
  );
}

export function SectionCard({ emoji, title, right, children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`sticker wobble relative bg-card p-5 ${title && title.length % 2 === 0 ? "rotate-[0.5deg]" : "-rotate-[0.45deg]"} ${
        onClick ? "cursor-pointer transition-all hover:rotate-0 hover:-translate-y-0.5" : ""
      } ${className}`}
    >
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            {emoji && <span>{emoji}</span>}
            {title}
          </h3>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Bar({ value, max = 100, h = "h-3" }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`goal-track ${h} w-full overflow-hidden rounded-full border-2 border-[var(--ink)] bg-[var(--paper)]`}>
      <div className="goal-fill h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatChip({ emoji, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full border-[2.5px] border-[var(--ink)] bg-[var(--pop2)] px-3.5 py-1.5 text-sm text-[var(--ink)] shadow-[2px_2px_0_var(--dust)] dark:border-[var(--ink)] dark:text-[var(--ink)]">
      <span>{emoji}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

export function Empty({ emoji = "🌸", text, children }) {
  return (
    <div className="grid -rotate-1 place-items-center gap-2 rounded-[22px] border-[2.5px] border-dashed border-[var(--dust)] bg-[var(--paper)] px-4 py-8 text-center dark:bg-[var(--paper)]">
      <span className="floaty text-3xl">{emoji}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, tone = "pink", className = "", disabled, type = "button" }) {
  const tones = {
    pink: "bg-[var(--pop)] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] hover:-translate-y-0.5",
    soft: "bg-[var(--pop2)] text-[var(--ink)] shadow-[3px_3px_0_var(--dust)] hover:-translate-y-0.5",
    ghost: "bg-transparent text-[var(--dust)] shadow-none hover:bg-[color-mix(in_srgb,var(--pop2)_60%,transparent)]",
    sage: "bg-[var(--dust)] text-[var(--paper)] shadow-[3px_3px_0_var(--ink)] hover:-translate-y-0.5",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-2xl border-[2.5px] border-[var(--ink)] px-4 py-2 text-sm font-bold transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 dark:border-[var(--ink)] ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function PageHead({ emoji, title, sub, right }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          {emoji} {title}
        </h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function MonthNav({ label, onPrev, onNext }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        className="grid h-8 w-8 place-items-center rounded-xl border-[2.5px] border-[var(--ink)] bg-[var(--pop2)] font-display text-lg text-[var(--ink)] shadow-[2px_2px_0_var(--dust)] transition hover:-translate-y-0.5"
      >
        ‹
      </button>
      <span className="min-w-40 text-center font-display text-base font-semibold">{label}</span>
      <button
        type="button"
        onClick={onNext}
        className="grid h-8 w-8 place-items-center rounded-xl border-[2.5px] border-[var(--ink)] bg-[var(--pop2)] font-display text-lg text-[var(--ink)] shadow-[2px_2px_0_var(--dust)] transition hover:-translate-y-0.5"
      >
        ›
      </button>
    </div>
  );
}

export function Heatmap({ dates, doneSet, today, onToggle }) {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const firstDow = dates.length ? (new Date(`${dates[0]}T00:00:00`).getDay() + 6) % 7 : 0;
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  dates.forEach((d) => cells.push(d));
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 pb-1 text-center text-[11px] font-bold text-muted-foreground/80">
        {names.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const done = doneSet.has(d);
          const isToday = d === today;
          const future = d > today;
          let cls = "cursor-default bg-muted/50 text-muted-foreground/40";
          if (done) cls = "border-[2px] border-[var(--ink)] bg-[var(--pop2)] text-[var(--ink)] shadow-[2px_2px_0_var(--dust)] hover:opacity-80";
          else if (isToday) cls = "border-[2px] border-[var(--ink)] bg-[var(--pop)] text-[var(--ink)] hover:scale-105";
          else if (!future) cls = "border-[2px] border-[color-mix(in_srgb,var(--dust)_40%,transparent)] bg-[color-mix(in_srgb,var(--pop)_40%,transparent)] text-[var(--dust)] hover:scale-105";
          return (
            <button
              key={d}
              type="button"
              disabled={future || !onToggle}
              onClick={() => onToggle && onToggle(d)}
              title={d}
              className={`grid aspect-square place-items-center rounded-xl text-xs font-bold transition-all ${cls}`}
            >
              {done ? "✓" : new Date(`${d}T00:00:00`).getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--ink)] bg-[var(--pop2)]" /> completed</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--pop)]" /> missed</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-primary/40" /> today</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-muted" /> future</span>
      </div>
    </div>
  );
}

export function Dots({ count, target }) {
  const { theme } = useTheme();
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: target }).map((_, i) => {
        const on = i < count;
        if (theme === "galaxy") {
          return <span key={i} className={`text-sm leading-none ${on ? "" : "opacity-30"}`}>{on ? "⭐" : "·"}</span>;
        }
        return (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 border-[var(--ink)] transition-all ${
              on
                ? theme === "boba"
                  ? "bg-[radial-gradient(circle_at_35%_35%,#fff_0_2px,var(--ink)_3px,var(--pop)_6px)]"
                  : "bg-[var(--pop2)]"
                : "bg-[var(--paper)]"
            }`}
          />
        );
      })}
    </div>
  );
}
