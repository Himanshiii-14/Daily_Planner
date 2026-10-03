export const CATEGORIES = {
  office: { emoji: "💻", label: "Office", bg: "#E3F2FD", fg: "#4A6FA5" },
  home: { emoji: "🏠", label: "Home", bg: "#FFF3E0", fg: "#B07B3E" },
  personal: { emoji: "🌱", label: "Personal", bg: "#E8F5E9", fg: "#5B8A5E" },
  health: { emoji: "💪", label: "Health", bg: "#FCE4EC", fg: "#C25B7C" },
  learning: { emoji: "📚", label: "Learning", bg: "#EDE7F6", fg: "#7E6BB0" },
  money: { emoji: "💰", label: "Money", bg: "#FFF9DB", fg: "#A3852D" },
  selfcare: { emoji: "🧖", label: "Self-care", bg: "#F9E8F5", fg: "#9C64A5" },
  goals: { emoji: "🎯", label: "Goals", bg: "#E9E2F6", fg: "#6B5B95" },
};

export const PRIORITIES = {
  none: { label: "—", color: "#C9C3D6" },
  low: { label: "Low", color: "#A8C8A0" },
  medium: { label: "Medium", color: "#F2C57C" },
  high: { label: "High", color: "#E88CA0" },
};

export const MOODS = ["😊", "🥰", "😌", "😤", "😢", "🤒", "😴", "🥳"];

export const EMOJI_ROW = ["🌸", "🌷", "💧", "🏋️", "📚", "🧘", "🥗", "💰", "🧴", "📖", "😴", "🧹", "💇", "🧖", "💅", "✈️", "🎯", "💻", "🏠", "🌱"];

export const QUOTES = [
  "You don't have to do everything today. ♡",
  "Small steps every day 🌷",
  "Bloom at your own pace 🌸",
  "You're doing better than you think ✨",
  "Slow progress is still progress ☁️",
  "Today is a fresh page 📖",
  "Be soft, be steady 🎀",
  "Rest is productive too 🌿",
  "Little things add up ⭐",
  "You are allowed to begin again 🌱",
  "Do something your future self will thank you for 💌",
  "Peace begins with a deep breath ☁️",
];

export const pad2 = (n) => String(n).padStart(2, "0");

export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const weekStart = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return addDays(dateStr, -((d.getDay() + 6) % 7));
};

export const dow = (dateStr) => new Date(`${dateStr}T00:00:00`).getDay();

export const fmtDay = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

export const fmtShort = (dateStr) =>
  new Date(`${String(dateStr).slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export const pickQuote = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
};

export const api = async (path, opts = {}) => {
  const r = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...opts,
  });
  if (r.status === 401) {
    const e = new Error("locked");
    e.locked = true;
    throw e;
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
};

export const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body) });
export const patch = (path, body) => api(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = (path) => api(path, { method: "DELETE" });

export const compressImage = (file, max = 500) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
