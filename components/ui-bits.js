"use client";

export function CuteCheck({ done, onClick, size = 26, color = "#A8C8A0" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      className={`relative grid shrink-0 place-items-center rounded-full border-2 transition-all duration-300 active:scale-90 ${
        done
          ? "border-transparent shadow-sm"
          : "border-[#E5CBD8] bg-white hover:scale-110 hover:border-[#E8A0B4] dark:border-[#4A4262] dark:bg-[#373148]"
      }`}
      style={{ width: size, height: size, background: done ? color : undefined }}
    >
      {done && (
        <svg
          key={String(done)}
          className="anim-pop"
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}

export function Burst({ id }) {
  if (!id) return null;
  const petals = ["🌸", "⭐", "♡", "✿", "✨"];
  return (
    <span key={id} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      {petals.map((p, i) => (
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
      className={`rounded-[1.4rem] border border-border/70 bg-card p-5 shadow-card ${
        onClick ? "cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-soft" : ""
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

export function Bar({ value, max = 100, h = "h-3", from = "#F2B5C6", to = "#C9B6E4" }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`${h} w-full overflow-hidden rounded-full bg-muted`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }}
      />
    </div>
  );
}

export function StatChip({ emoji, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-sm shadow-sm">
      <span>{emoji}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

export function Empty({ emoji = "🌸", text, children }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border-2 border-dashed border-border/80 px-4 py-8 text-center">
      <span className="floaty text-3xl">{emoji}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, tone = "pink", className = "", disabled, type = "button" }) {
  const tones = {
    pink: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/30",
    soft: "bg-primary/10 text-primary hover:bg-primary/20",
    ghost: "text-muted-foreground hover:bg-muted",
    sage: "bg-[#9DBB96] text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-40 ${tones[tone]} ${className}`}
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
        className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground transition hover:bg-muted"
      >
        ‹
      </button>
      <span className="min-w-40 text-center font-display text-base font-semibold">{label}</span>
      <button
        type="button"
        onClick={onNext}
        className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground transition hover:bg-muted"
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
          if (done) cls = "bg-[#A8C8A0] text-white shadow-sm hover:opacity-80";
          else if (isToday) cls = "bg-primary/15 text-primary ring-2 ring-primary/40 hover:scale-105";
          else if (!future) cls = "bg-rose-100/80 text-rose-400 hover:scale-105 dark:bg-[#3A2F3F] dark:text-rose-300/60";
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
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#A8C8A0]" /> completed</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-rose-200 dark:bg-[#4A3542]" /> missed</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-primary/40" /> today</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-muted" /> future</span>
      </div>
    </div>
  );
}

export function Dots({ count, target }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full transition-all ${i < count ? "bg-[#A8C8A0]" : "bg-muted ring-1 ring-border"}`}
        />
      ))}
    </div>
  );
}
