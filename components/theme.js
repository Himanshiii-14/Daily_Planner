"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  {
    id: "retro",
    label: "Retro Sticker Pop",
    emoji: "😁",
    check: "😁",
    cheer: "you did a thing!",
    petals: ["⭐", "😁", "💛", "✨", "💙"],
    stickers: ["⭐", "😁", "💛", "💙", "✨"],
  },
  {
    id: "galaxy",
    label: "Lavender Galaxy Gremlin",
    emoji: "🌙",
    check: "⭐",
    cheer: "cosmic streak!",
    petals: ["⭐", "🌙", "✨", "💫", "🪐"],
    stickers: ["🌙", "⭐", "✨", "🪐", "💫"],
  },
  {
    id: "boba",
    label: "Bubble Tea Brain",
    emoji: "🧋",
    check: "●",
    cheer: "sip sip!",
    petals: ["🧋", "💗", "🟤", "✨", "🧋"],
    stickers: ["🧋", "💗", "🟤", "✨", "🧋"],
  },
];

const ThemeContext = createContext({
  theme: "retro",
  setTheme: () => {},
  themes: THEMES,
  current: THEMES[0],
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("retro");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mlf-look");
    if (THEMES.some((t) => t.id === saved)) setThemeState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute("data-look", theme);
    localStorage.setItem("mlf-look", theme);
  }, [theme, ready]);

  const setTheme = (id) => {
    if (THEMES.some((t) => t.id === id)) setThemeState(id);
  };

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  return <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, current }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme, themes } = useTheme();
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.label}
            onClick={() => setTheme(t.id)}
            className={`grid h-9 w-9 place-items-center rounded-xl border-2 text-base transition ${
              theme === t.id ? "border-[var(--ink)] bg-[var(--pop)] shadow-[2px_2px_0_var(--ink)]" : "border-transparent hover:bg-[var(--paper)]"
            }`}
          >
            {t.emoji}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          className={`rounded-2xl border-[2.5px] p-3 text-left transition ${
            theme === t.id ? "border-[var(--ink)] bg-[var(--pop)] shadow-[3px_3px_0_var(--ink)]" : "border-[var(--dust)] bg-card hover:-translate-y-0.5"
          }`}
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className="mt-1 block text-sm font-bold">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
