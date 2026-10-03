import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import crypto from "crypto";
import { AsyncLocalStorage } from "async_hooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "mylittlelife";

const g = globalThis;
const sessionStore = new AsyncLocalStorage();

const PLANNER = new Set([
  "tasks",
  "habits",
  "habitCompletions",
  "weeklyGoals",
  "weeklyCompletions",
  "monthlyGoals",
  "yearlyGoals",
  "foodEntries",
  "moneyEntries",
  "dailyNotes",
]);

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    if (value._bsontype === "ObjectId" || value instanceof Date) {
      return value instanceof Date ? value.toISOString() : String(value);
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "_id") continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

function json(data, status = 200) {
  return NextResponse.json(clean(data), { status });
}

function docOf(result) {
  if (!result) return null;
  if (result.lastErrorObject && "value" in result) return result.value;
  return result;
}

async function db() {
  if (!g._mllClientPromise) {
    const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 4000 });
    g._mllClientPromise = client.connect().catch((err) => {
      g._mllClientPromise = null;
      throw err;
    });
  }
  try {
    const client = await g._mllClientPromise;
    return client.db(DB_NAME);
  } catch (e) {
    g._mllClientPromise = null;
    throw new Error(friendlyError(e));
  }
}

async function raw(name) {
  return (await db()).collection(name);
}

function me() {
  const user = sessionStore.getStore()?.user;
  if (!user) throw new Error("Not signed in");
  return user;
}

function scoped(collection) {
  const own = (filter = {}) => ({ ...filter, userId: me().id });
  const stamp = (doc) => ({ ...doc, userId: me().id });
  return {
    find: (filter, opts) => collection.find(own(filter), opts),
    findOne: (filter, opts) => collection.findOne(own(filter), opts),
    insertOne: (doc, opts) => collection.insertOne(stamp(doc), opts),
    insertMany: (docs, opts) => collection.insertMany(docs.map(stamp), opts),
    updateOne: (filter, update, opts) => collection.updateOne(own(filter), update, opts),
    updateMany: (filter, update, opts) => collection.updateMany(own(filter), update, opts),
    deleteOne: (filter, opts) => collection.deleteOne(own(filter), opts),
    deleteMany: (filter, opts) => collection.deleteMany(own(filter), opts),
    countDocuments: (filter = {}, opts) => collection.countDocuments(own(filter), opts),
    findOneAndUpdate: (filter, update, opts) => collection.findOneAndUpdate(own(filter), update, opts),
  };
}

async function coll(name) {
  const collection = await raw(name);
  return PLANNER.has(name) ? scoped(collection) : collection;
}

const uuid = () => crypto.randomUUID();
const pad2 = (n) => String(n).padStart(2, "0");
const now = () => new Date().toISOString();
const SERVER_TODAY = () => new Date().toISOString().slice(0, 10);

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function monthDates(month) {
  const [y, m] = month.split("-").map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${month}-${pad2(i + 1)}`);
}

function weekStart(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return addDays(dateStr, -((d.getUTCDay() + 6) % 7));
}

function safeDate(v, fallback) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : fallback;
}

function safeMonth(v, fallback) {
  return /^\d{4}-\d{2}$/.test(v || "") ? v : fallback;
}

function safeYear(v, fallback) {
  return /^\d{4}$/.test(v || "") ? v : fallback;
}

function currentStreak(set, today) {
  let d = today;
  let n = 0;
  if (!set.has(d)) {
    d = addDays(d, -1);
    if (!set.has(d)) return 0;
  }
  while (set.has(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

function bestStreak(dates) {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

function pickFields(body, keys) {
  const o = {};
  keys.forEach((k) => {
    if (body[k] !== undefined) o[k] = body[k];
  });
  return o;
}

function escapeRegex(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

function validPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

function validName(value) {
  const name = String(value || "").trim();
  if (name.length < 1 || name.length > 40) return "";
  return name;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash || !validPassword(password)) return false;
  const actual = Buffer.from(hash, "hex");
  const check = crypto.scryptSync(password, salt, 32);
  if (actual.length !== check.length) return false;
  return crypto.timingSafeEqual(actual, check);
}

function cookieToken(req) {
  const match = (req.headers.get("cookie") || "").match(/(?:^|; )life_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function sessionCookie(res, req, token) {
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  res.cookies.set("life_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: token ? 60 * 60 * 24 * 30 : 0,
  });
}

async function ensureAuthIndexes() {
  if (g._mllAuthIndexes) return;
  const users = await raw("users");
  const sessions = await raw("sessions");
  await users.createIndex({ email: 1 }, { unique: true });
  await sessions.createIndex({ token: 1 }, { unique: true });
  g._mllAuthIndexes = true;
}

async function userFromRequest(req) {
  const token = cookieToken(req);
  if (!token) return null;
  const session = await (await raw("sessions")).findOne({ token });
  if (!session) return null;
  if (session.expiresAt && session.expiresAt < now()) {
    await (await raw("sessions")).deleteOne({ token });
    return null;
  }
  const user = await (await raw("users")).findOne({ id: session.userId });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

async function authed(req, fn) {
  const user = await userFromRequest(req);
  if (!user) return locked();
  return sessionStore.run({ user }, fn);
}

async function openSession(req, user) {
  const token = uuid();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await (await raw("sessions")).insertOne({ token, userId: user.id, createdAt: now(), expiresAt: expires });
  const res = json({ ok: true, name: user.name, email: user.email });
  sessionCookie(res, req, token);
  return res;
}

async function claimLegacy(userId) {
  for (const name of PLANNER) {
    await (await raw(name)).updateMany({ userId: { $exists: false } }, { $set: { userId } });
  }
}

const MONGO_HINT = "Cannot reach MongoDB. Start it (or run `docker compose up -d`) and check MONGO_URL in .env.";

function friendlyError(e) {
  const msg = e?.message || "error";
  if (/ECONNREFUSED|ServerSelection|MongoNetwork|getaddrinfo|ENOTFOUND/i.test(msg)) return MONGO_HINT;
  return msg;
}

const locked = () => json({ locked: true }, 401);
const fail = (e) => json({ error: friendlyError(e) }, 500);
const notFound = () => json({ error: "not found" }, 404);

async function getBootstrap(q) {
  const today = safeDate(q.get("today"), SERVER_TODAY());
  const month = today.slice(0, 7);
  const ws = weekStart(today);
  const user = me();
  const [tasks, habits, weeklyGoals, wc, todayComps, monthlyGoals, yearlyGoals, food, money, note] = await Promise.all([
    coll("tasks").then((c) => c.find({ date: today }).sort({ createdAt: 1 }).toArray()),
    coll("habits").then((c) => c.find({}).sort({ createdAt: 1 }).toArray()),
    coll("weeklyGoals").then((c) => c.find({}).sort({ createdAt: 1 }).toArray()),
    coll("weeklyCompletions").then((c) => c.find({ weekStart: ws }).toArray()),
    coll("habitCompletions").then((c) => c.find({ date: today }).toArray()),
    coll("monthlyGoals").then((c) => c.find({ month }).sort({ createdAt: 1 }).toArray()),
    coll("yearlyGoals").then((c) => c.find({}).sort({ createdAt: 1 }).toArray()),
    coll("foodEntries").then((c) => c.findOne({ date: today })),
    coll("moneyEntries").then((c) => c.findOne({ date: today })),
    coll("dailyNotes").then((c) => c.findOne({ date: today })),
  ]);
  const doneHabit = new Set(todayComps.map((c) => c.habitId));
  const wcCount = {};
  wc.forEach((c) => {
    wcCount[c.goalId] = (wcCount[c.goalId] || 0) + 1;
  });
  const taskDone = tasks.filter((t) => t.completed).length;
  const habitDone = habits.filter((h) => doneHabit.has(h.id)).length;
  return json({
    name: user.name,
    email: user.email,
    today,
    month,
    weekStart: ws,
    tasks,
    habits: habits.map((h) => ({ ...h, done: doneHabit.has(h.id) })),
    weeklyGoals: weeklyGoals.map((g) => ({ ...g, count: wcCount[g.id] || 0 })),
    monthlyGoals,
    yearlyGoals,
    food: food || null,
    money: money || null,
    note: note ? note.content : "",
    stats: {
      taskTotal: tasks.length,
      taskDone,
      habitTotal: habits.length,
      habitDone,
      weeklyTotal: weeklyGoals.length,
      weeklyHit: weeklyGoals.filter((g) => (wcCount[g.id] || 0) >= (g.target || 1)).length,
    },
  });
}

async function getDay(q) {
  const date = safeDate(q.get("date"), SERVER_TODAY());
  const [tasks, habits, comps, food, money, note, wcomps] = await Promise.all([
    coll("tasks").then((c) => c.find({ date }).sort({ createdAt: 1 }).toArray()),
    coll("habits").then((c) => c.find({}).sort({ createdAt: 1 }).toArray()),
    coll("habitCompletions").then((c) => c.find({ date }).toArray()),
    coll("foodEntries").then((c) => c.findOne({ date })),
    coll("moneyEntries").then((c) => c.findOne({ date })),
    coll("dailyNotes").then((c) => c.findOne({ date })),
    coll("weeklyCompletions").then((c) => c.find({ date }).toArray()),
  ]);
  const done = new Set(comps.map((c) => c.habitId));
  const wgIds = [...new Set(wcomps.map((c) => c.goalId))];
  const weeklyGoals = wgIds.length
    ? await coll("weeklyGoals").then((c) => c.find({ id: { $in: wgIds } }).toArray())
    : [];
  return json({
    date,
    tasks,
    habits: habits.map((h) => ({ ...h, done: done.has(h.id) })),
    food: food || null,
    money: money || null,
    note: note ? note.content : "",
    weeklyGoals,
  });
}

async function getHabitMonth(q) {
  const today = safeDate(q.get("today"), SERVER_TODAY());
  const month = safeMonth(q.get("month"), today.slice(0, 7));
  const habitId = q.get("habit");
  const habit = await coll("habits").then((c) => c.findOne({ id: habitId }));
  if (!habit) return json({ error: "habit not found" }, 404);
  const comps = await coll("habitCompletions").then((c) => c.find({ habitId, date: { $regex: `^${month}` } }).toArray());
  const doneSet = new Set(comps.map((c) => c.date));
  const dates = monthDates(month);
  const elapsed = dates.filter((d) => d <= today).length;
  const completed = dates.filter((d) => doneSet.has(d)).length;
  const all = await coll("habitCompletions").then((c) => c.find({ habitId }).toArray());
  const allDates = all.map((c) => c.date).sort();
  return json({
    habit,
    month,
    dates,
    done: [...doneSet],
    stats: {
      completed,
      elapsed,
      pct: elapsed ? Math.round((completed / elapsed) * 100) : 0,
      streak: currentStreak(new Set(allDates), today),
      best: bestStreak(allDates),
      total: allDates.length,
    },
  });
}

async function getHabitYear(q) {
  const today = safeDate(q.get("today"), SERVER_TODAY());
  const year = safeYear(q.get("year"), today.slice(0, 4));
  const habits = await coll("habits").then((c) => c.find({}).sort({ createdAt: 1 }).toArray());
  const comps = await coll("habitCompletions").then((c) => c.find({ date: { $regex: `^${year}` } }).toArray());
  const byHabit = {};
  comps.forEach((c) => {
    byHabit[c.habitId] = (byHabit[c.habitId] || 0) + 1;
  });
  return json({
    year,
    habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, days: byHabit[h.id] || 0 })),
  });
}

async function getWeekly(q) {
  const today = safeDate(q.get("today"), SERVER_TODAY());
  const month = safeMonth(q.get("month"), today.slice(0, 7));
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lastDate = `${month}-${pad2(lastDay)}`;
  const weeks = [];
  let w = weekStart(`${month}-01`);
  while (w <= lastDate) {
    weeks.push({ start: w, end: addDays(w, 6) });
    w = addDays(w, 7);
  }
  const rangeStart = weeks[0]?.start || `${month}-01`;
  const rangeEnd = weeks[weeks.length - 1]?.end || lastDate;
  const todayWs = weekStart(today);
  const [goals, comps, weekComps] = await Promise.all([
    coll("weeklyGoals").then((c) => c.find({}).sort({ createdAt: 1 }).toArray()),
    coll("weeklyCompletions").then((c) => c.find({ date: { $gte: rangeStart, $lte: rangeEnd } }).toArray()),
    coll("weeklyCompletions").then((c) => c.find({ weekStart: todayWs }).toArray()),
  ]);
  const count = {};
  comps.forEach((c) => {
    const k = `${c.goalId}|${c.weekStart || weekStart(c.date)}`;
    count[k] = (count[k] || 0) + 1;
  });
  const thisWeek = {};
  weekComps.forEach((c) => {
    thisWeek[c.goalId] = (thisWeek[c.goalId] || 0) + 1;
  });
  const todayCount = {};
  weekComps.filter((c) => c.date === today).forEach((c) => {
    todayCount[c.goalId] = (todayCount[c.goalId] || 0) + 1;
  });
  return json({ goals, weeks, count, thisWeek, todayCount, today, month });
}

async function getMonthly(q) {
  const month = safeMonth(q.get("month"), SERVER_TODAY().slice(0, 7));
  const goals = await coll("monthlyGoals").then((c) => c.find({ month }).sort({ createdAt: 1 }).toArray());
  return json({ month, goals });
}

async function getMonthlyYear(q) {
  const today = safeDate(q.get("today"), SERVER_TODAY());
  const year = safeYear(q.get("year"), today.slice(0, 4));
  const docs = await coll("monthlyGoals").then((c) =>
    c.find({ month: { $regex: `^${year}` } }).sort({ month: 1, createdAt: 1 }).toArray()
  );
  const groups = {};
  docs.forEach((d) => {
    const key = (d.name || "").toLowerCase();
    if (!groups[key]) {
      groups[key] = { name: d.name, emoji: d.emoji || "🌸", category: d.category || "selfcare", months: {}, done: 0 };
    }
    const mm = d.month.slice(5, 7);
    groups[key].months[mm] = { id: d.id, completed: !!d.completed };
    if (d.completed) groups[key].done += 1;
  });
  return json({ year, goals: Object.values(groups) });
}

async function getYearDashboard(q) {
  const today = safeDate(q.get("today"), SERVER_TODAY());
  const year = safeYear(q.get("year"), today.slice(0, 4));
  const habits = await coll("habits").then((c) => c.find({}).sort({ createdAt: 1 }).toArray());
  const comps = await coll("habitCompletions").then((c) => c.find({ date: { $regex: `^${year}` } }).toArray());
  const byHabit = {};
  comps.forEach((c) => {
    byHabit[c.habitId] = (byHabit[c.habitId] || 0) + 1;
  });
  const docs = await coll("monthlyGoals").then((c) => c.find({ month: { $regex: `^${year}` } }).toArray());
  const mg = {};
  docs.forEach((d) => {
    const k = d.name;
    if (!mg[k]) mg[k] = { name: d.name, emoji: d.emoji || "🌸", done: 0 };
    if (d.completed) mg[k].done += 1;
  });
  const yearlyGoals = await coll("yearlyGoals").then((c) => c.find({}).sort({ createdAt: 1 }).toArray());
  return json({
    year,
    today,
    habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, days: byHabit[h.id] || 0 })),
    monthlyGoals: Object.values(mg),
    yearlyGoals,
  });
}

async function getFood(q) {
  const date = safeDate(q.get("date"), null);
  const month = safeMonth(q.get("month"), null);
  if (date) return json({ entry: await coll("foodEntries").then((c) => c.findOne({ date })) });
  if (month) {
    const entries = await coll("foodEntries").then((c) => c.find({ date: { $regex: `^${month}` } }).sort({ date: 1 }).toArray());
    return json({ entries });
  }
  return json({ entries: [] });
}

async function getMoney(q) {
  const today = safeDate(q.get("today"), SERVER_TODAY());
  const date = safeDate(q.get("date"), null);
  const month = safeMonth(q.get("month"), null);
  if (date) return json({ entry: await coll("moneyEntries").then((c) => c.findOne({ date })) });
  if (month) {
    const entries = await coll("moneyEntries").then((c) => c.find({ date: { $regex: `^${month}` } }).sort({ date: 1 }).toArray());
    const elapsed = monthDates(month).filter((d) => d <= today).length;
    const tracked = entries.filter((e) => e.tracked).length;
    const total = entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return json({ entries, stats: { tracked, elapsed, total } });
  }
  return json({ entries: [] });
}

async function getNotes(q) {
  const date = safeDate(q.get("date"), null);
  if (date) return json({ note: await coll("dailyNotes").then((c) => c.findOne({ date })) });
  const notes = await coll("dailyNotes").then((c) => c.find({}).sort({ date: -1 }).limit(30).toArray());
  return json({ notes });
}

async function searchAll(q) {
  const term = (q.get("q") || "").trim().slice(0, 80);
  if (!term) return json({ results: [] });
  const rx = new RegExp(escapeRegex(term), "i");
  const [tasks, weekly, monthly, yearly, notes, habits] = await Promise.all([
    coll("tasks").then((c) => c.find({ title: rx }).limit(10).toArray()),
    coll("weeklyGoals").then((c) => c.find({ name: rx }).limit(5).toArray()),
    coll("monthlyGoals").then((c) => c.find({ name: rx }).limit(10).toArray()),
    coll("yearlyGoals").then((c) => c.find({ $or: [{ name: rx }, { description: rx }] }).limit(5).toArray()),
    coll("dailyNotes").then((c) => c.find({ content: rx }).limit(10).toArray()),
    coll("habits").then((c) => c.find({ name: rx }).limit(5).toArray()),
  ]);
  const results = [
    ...tasks.map((t) => ({ type: "Task", emoji: "☀️", label: t.title, date: t.date })),
    ...habits.map((h) => ({ type: "Habit", emoji: h.emoji || "🌱", label: h.name })),
    ...weekly.map((w) => ({ type: "Weekly Goal", emoji: w.emoji || "🌸", label: w.name })),
    ...monthly.map((m) => ({ type: "Monthly Goal", emoji: m.emoji || "🗓️", label: m.name, date: m.month })),
    ...yearly.map((y) => ({ type: "Yearly Goal", emoji: "✨", label: y.name })),
    ...notes.map((n) => ({ type: "Note", emoji: "📝", label: (n.content || "").slice(0, 80), date: n.date })),
  ];
  return json({ results });
}

async function createTask(b) {
  const doc = {
    id: uuid(),
    title: (b.title || "").trim() || "Untitled task",
    category: b.category || "personal",
    priority: b.priority || "none",
    notes: b.notes || "",
    time: b.time || "",
    date: safeDate(b.date, SERVER_TODAY()),
    completed: false,
    createdAt: now(),
  };
  await coll("tasks").then((c) => c.insertOne(doc));
  return json(doc);
}

async function toggleHabit(b) {
  const habitId = b.habitId;
  const date = safeDate(b.date, null);
  if (!habitId || !date) return json({ error: "habitId and date are required" }, 400);
  const c = await coll("habitCompletions");
  const ex = await c.findOne({ habitId, date });
  if (ex) {
    await c.deleteOne({ _id: ex._id });
    return json({ habitId, date, done: false });
  }
  await c.insertOne({ id: uuid(), habitId, date, createdAt: now() });
  return json({ habitId, date, done: true });
}

async function createHabit(b) {
  const doc = { id: uuid(), name: (b.name || "").trim() || "New habit", emoji: b.emoji || "🌱", createdAt: now() };
  await coll("habits").then((c) => c.insertOne(doc));
  return json(doc);
}

async function createWeekly(b) {
  const doc = {
    id: uuid(),
    name: (b.name || "").trim() || "New goal",
    emoji: b.emoji || "🌸",
    target: Math.max(1, Math.min(7, Number(b.target) || 1)),
    createdAt: now(),
  };
  await coll("weeklyGoals").then((c) => c.insertOne(doc));
  return json(doc);
}

async function toggleWeekly(b) {
  const { goalId } = b;
  const date = safeDate(b.date, null);
  if (!goalId || !date) return json({ error: "goalId and date are required" }, 400);
  const c = await coll("weeklyCompletions");
  const ex = await c.findOne({ goalId, date });
  if (ex) {
    await c.deleteOne({ _id: ex._id });
    return json({ goalId, date, done: false });
  }
  await c.insertOne({ id: uuid(), goalId, date, weekStart: weekStart(date), createdAt: now() });
  return json({ goalId, date, done: true });
}

async function createMonthly(b) {
  const doc = {
    id: uuid(),
    name: (b.name || "").trim() || "New goal",
    emoji: b.emoji || "🌸",
    category: b.category || "selfcare",
    month: safeMonth(b.month, SERVER_TODAY().slice(0, 7)),
    notes: b.notes || "",
    completed: false,
    completedAt: null,
    createdAt: now(),
  };
  await coll("monthlyGoals").then((c) => c.insertOne(doc));
  return json(doc);
}

async function createYearly(b) {
  const doc = {
    id: uuid(),
    name: (b.name || "").trim() || "New goal",
    description: b.description || "",
    category: b.category || "goals",
    target: b.target ? Number(b.target) : null,
    deadline: b.deadline || "",
    notes: b.notes || "",
    progress: 0,
    milestones: [],
    createdAt: now(),
  };
  await coll("yearlyGoals").then((c) => c.insertOne(doc));
  return json(doc);
}

async function upsertFood(b) {
  const date = safeDate(b.date, SERVER_TODAY());
  const set = pickFields(b, ["breakfast", "lunch", "snacks", "dinner", "notes", "mood", "photo"]);
  set.updatedAt = now();
  const result = await coll("foodEntries").then((c) =>
    c.findOneAndUpdate(
      { date },
      { $set: set, $setOnInsert: { id: uuid(), date, createdAt: now() } },
      { upsert: true, returnDocument: "after" }
    )
  );
  return json(docOf(result));
}

async function upsertMoney(b) {
  const date = safeDate(b.date, SERVER_TODAY());
  const set = {};
  if (b.tracked !== undefined) set.tracked = !!b.tracked;
  if (b.amount !== undefined) set.amount = b.amount === "" || b.amount === null ? "" : Number(b.amount);
  if (b.notes !== undefined) set.notes = b.notes;
  set.updatedAt = now();
  const result = await coll("moneyEntries").then((c) =>
    c.findOneAndUpdate(
      { date },
      { $set: set, $setOnInsert: { id: uuid(), date, createdAt: now() } },
      { upsert: true, returnDocument: "after" }
    )
  );
  return json(docOf(result));
}

async function upsertNote(b) {
  const date = safeDate(b.date, SERVER_TODAY());
  const result = await coll("dailyNotes").then((c) =>
    c.findOneAndUpdate(
      { date },
      { $set: { content: b.content || "", updatedAt: now() }, $setOnInsert: { id: uuid(), date, createdAt: now() } },
      { upsert: true, returnDocument: "after" }
    )
  );
  return json(docOf(result));
}

async function updateSettings(b) {
  const name = validName(b.name) || "Friend";
  await (await raw("users")).updateOne({ id: me().id }, { $set: { name } });
  return json({ name, email: me().email });
}

async function addMilestone(b) {
  const result = await coll("yearlyGoals").then((c) =>
    c.findOneAndUpdate(
      { id: b.goalId },
      { $push: { milestones: { id: uuid(), title: (b.title || "").trim() || "Milestone", done: false } } },
      { returnDocument: "after" }
    )
  );
  const doc = docOf(result);
  if (!doc) return notFound();
  return json(doc);
}

async function authSignup(req, b) {
  await ensureAuthIndexes();
  const name = validName(b.name);
  const email = normEmail(b.email);
  const password = b.password;
  if (!name) return json({ error: "Name is required" }, 400);
  if (!validEmail(email)) return json({ error: "Enter a valid email" }, 400);
  if (!validPassword(password)) return json({ error: "Password must be at least 8 characters" }, 400);
  const users = await raw("users");
  const first = (await users.countDocuments()) === 0;
  const user = { id: uuid(), name, email, passwordHash: hashPassword(password), createdAt: now() };
  try {
    await users.insertOne(user);
  } catch (e) {
    if (e?.code === 11000) return json({ error: "An account with that email already exists" }, 409);
    throw e;
  }
  if (first) await claimLegacy(user.id);
  return openSession(req, user);
}

async function authSignin(req, b) {
  await ensureAuthIndexes();
  const email = normEmail(b.email);
  const password = b.password;
  const user = validEmail(email) ? await (await raw("users")).findOne({ email }) : null;
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return json({ error: "Email or password is wrong" }, 401);
  }
  return openSession(req, user);
}

async function authSignout(req) {
  const token = cookieToken(req);
  if (token) await (await raw("sessions")).deleteOne({ token });
  const res = json({ ok: true });
  sessionCookie(res, req, "");
  return res;
}

async function authChangePassword(b) {
  if (!validPassword(b.newPassword)) return json({ error: "New password must be at least 8 characters" }, 400);
  const users = await raw("users");
  const user = await users.findOne({ id: me().id });
  if (!user || !verifyPassword(b.currentPassword || "", user.passwordHash)) {
    return json({ error: "Current password is wrong" }, 400);
  }
  await users.updateOne({ id: user.id }, { $set: { passwordHash: hashPassword(b.newPassword) } });
  return json({ ok: true });
}

async function seed() {
  const today = SERVER_TODAY();
  const out = {};
  const hc = await coll("habits");
  if ((await hc.countDocuments({})) === 0) {
    const defs = [
      { name: "Water goal", emoji: "💧", p: 0.85 },
      { name: "Gym", emoji: "🏋️", p: 0.6 },
      { name: "Study", emoji: "📚", p: 0.55 },
      { name: "Skincare", emoji: "🧴", p: 0.75 },
      { name: "Read", emoji: "📖", p: 0.65 },
    ];
    const habits = defs.map((d) => ({ id: uuid(), name: d.name, emoji: d.emoji, createdAt: now() }));
    await hc.insertMany(habits);
    out.habits = habits.length;
    const comps = [];
    habits.forEach((h, hi) => {
      for (let i = 70; i >= 1; i -= 1) {
        const d = addDays(today, -i);
        const prob = i <= 4 ? 0.97 : defs[hi].p;
        if (Math.random() < prob) comps.push({ id: uuid(), habitId: h.id, date: d, createdAt: now() });
      }
    });
    if (comps.length) {
      await coll("habitCompletions").then((c) => c.insertMany(comps));
      out.completions = comps.length;
    }
  }
  const tc = await coll("tasks");
  if ((await tc.countDocuments({})) === 0) {
    const t = [
      { title: "Finish Teams integration", category: "office", priority: "high", time: "10:00", completed: false },
      { title: "Review PR", category: "office", priority: "medium", time: "", completed: false },
      { title: "Reply to emails", category: "office", priority: "low", time: "", completed: true },
      { title: "Laundry", category: "home", priority: "none", time: "", completed: false },
      { title: "Grocery shopping", category: "home", priority: "none", time: "18:30", completed: false },
      { title: "Read 20 pages", category: "personal", priority: "none", time: "", completed: true },
    ];
    await tc.insertMany(t.map((x) => ({ id: uuid(), ...x, notes: "", date: today, createdAt: now() })));
    out.tasks = t.length;
  }
  const wc = await coll("weeklyGoals");
  if ((await wc.countDocuments({})) === 0) {
    const goals = [
      { name: "Wash hair", emoji: "🧴", target: 2, pattern: [2, 1, 2] },
      { name: "Study investments", emoji: "📚", target: 1, pattern: [1, 1, 0] },
      { name: "Gym", emoji: "🏋️", target: 4, pattern: [4, 3, 2] },
    ];
    const docs = goals.map((goal) => ({ id: uuid(), name: goal.name, emoji: goal.emoji, target: goal.target, createdAt: now() }));
    await wc.insertMany(docs);
    const month = today.slice(0, 7);
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const lastDate = `${month}-${pad2(lastDay)}`;
    const compsW = [];
    docs.forEach((goal, gi) => {
      const pattern = goals[gi].pattern;
      let cursor = weekStart(`${month}-01`);
      let wi = 0;
      while (cursor <= lastDate) {
        const c = pattern[wi % pattern.length];
        for (let k = 0; k < c; k += 1) {
          const d = addDays(cursor, k);
          if (d >= `${month}-01` && d <= lastDate && d < today) {
            compsW.push({ id: uuid(), goalId: goal.id, date: d, weekStart: cursor, createdAt: now() });
          }
        }
        cursor = addDays(cursor, 7);
        wi += 1;
      }
    });
    if (compsW.length) await coll("weeklyCompletions").then((c) => c.insertMany(compsW));
    out.weekly = docs.length;
  }
  const mc = await coll("monthlyGoals");
  if ((await mc.countDocuments({})) === 0) {
    const month = today.slice(0, 7);
    const prev = addDays(`${month}-01`, -1).slice(0, 7);
    await mc.insertMany([
      { id: uuid(), name: "Go to parlour", emoji: "💇", category: "selfcare", month, notes: "", completed: false, completedAt: null, createdAt: now() },
      { id: uuid(), name: "Go to spa", emoji: "🧖", category: "selfcare", month, notes: "So relaxing ♡", completed: true, completedAt: today, createdAt: now() },
      { id: uuid(), name: "Read one book", emoji: "📖", category: "learning", month, notes: "", completed: true, completedAt: addDays(today, -3), createdAt: now() },
      { id: uuid(), name: "Deep clean room", emoji: "🧹", category: "home", month, notes: "", completed: false, completedAt: null, createdAt: now() },
      { id: uuid(), name: "Go to spa", emoji: "🧖", category: "selfcare", month: prev, notes: "", completed: true, completedAt: `${prev}-15`, createdAt: now() },
      { id: uuid(), name: "Go to parlour", emoji: "💇", category: "selfcare", month: prev, notes: "", completed: true, completedAt: `${prev}-20`, createdAt: now() },
    ]);
    out.monthly = 6;
  }
  const yc = await coll("yearlyGoals");
  if ((await yc.countDocuments({})) === 0) {
    await yc.insertMany([
      {
        id: uuid(),
        name: "Read 12 books",
        description: "One cozy book every month",
        category: "learning",
        target: 12,
        deadline: "",
        notes: "",
        progress: 5,
        milestones: [
          { id: uuid(), title: "Read 4 books", done: true },
          { id: uuid(), title: "Read 8 books", done: true },
          { id: uuid(), title: "Read 12 books", done: false },
        ],
        createdAt: now(),
      },
      { id: uuid(), name: "Learn investing", description: "Study mutual funds & stocks", category: "money", target: null, deadline: "", notes: "", progress: 60, milestones: [], createdAt: now() },
      { id: uuid(), name: "Travel to 5 places", description: "New cities, new memories", category: "goals", target: 5, deadline: "", notes: "", progress: 2, milestones: [], createdAt: now() },
    ]);
    out.yearly = 3;
  }
  const fc = await coll("foodEntries");
  if ((await fc.countDocuments({})) === 0) {
    await fc.insertOne({
      id: uuid(),
      date: today,
      breakfast: "Oats + banana",
      lunch: "Rice + dal + vegetables",
      snacks: "Tea + biscuits",
      dinner: "Paneer + salad",
      notes: "Felt light and happy ♡",
      mood: "😊",
      photo: "",
      createdAt: now(),
      updatedAt: now(),
    });
  }
  const mnc = await coll("moneyEntries");
  if ((await mnc.countDocuments({})) === 0) {
    await mnc.insertOne({ id: uuid(), date: today, tracked: true, amount: 420, notes: "Coffee + groceries", createdAt: now(), updatedAt: now() });
  }
  const nc = await coll("dailyNotes");
  if ((await nc.countDocuments({})) === 0) {
    await nc.insertOne({ id: uuid(), date: today, content: "Today I want to feel calm and productive ♡", createdAt: now(), updatedAt: now() });
    await nc.insertOne({ id: uuid(), date: addDays(today, -1), content: "Slow evening, chamomile tea, journaling ✨", createdAt: now(), updatedAt: now() });
  }
  return json({ ok: true, ...out });
}

export async function GET(request, { params }) {
  const { path = [] } = await params;
  const q = new URL(request.url).searchParams;
  try {
    return await authed(request, async () => {
    if (!path.length || path[0] === "bootstrap") return await getBootstrap(q);
    switch (path[0]) {
      case "day":
        return await getDay(q);
      case "tasks": {
        const date = safeDate(q.get("date"), null);
        const month = safeMonth(q.get("month"), null);
        const filter = {};
        if (date) filter.date = date;
        else if (month) filter.date = { $regex: `^${month}` };
        const tasks = await coll("tasks").then((c) => c.find(filter).sort({ createdAt: 1 }).toArray());
        return json({ tasks });
      }
      case "habits":
        if (path[1] === "month") return await getHabitMonth(q);
        if (path[1] === "year") return await getHabitYear(q);
        return json({ habits: await coll("habits").then((c) => c.find({}).sort({ createdAt: 1 }).toArray()) });
      case "weekly":
        return await getWeekly(q);
      case "monthly":
        if (path[1] === "year") return await getMonthlyYear(q);
        return await getMonthly(q);
      case "yearly":
        if (path[1] === "dashboard") return await getYearDashboard(q);
        return json({ goals: await coll("yearlyGoals").then((c) => c.find({}).sort({ createdAt: 1 }).toArray()) });
      case "food":
        return await getFood(q);
      case "money":
        return await getMoney(q);
      case "notes":
        return await getNotes(q);
      case "search":
        return await searchAll(q);
      case "settings":
        return json({ name: me().name, email: me().email });
      default:
        return notFound();
    }
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request, { params }) {
  const { path = [] } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    if (path[0] === "auth") {
      if (path[1] === "signup") return await authSignup(request, body);
      if (path[1] === "signin") return await authSignin(request, body);
      if (path[1] === "signout") return await authSignout(request);
      if (path[1] === "password") return await authed(request, () => authChangePassword(body));
      return notFound();
    }
    return await authed(request, async () => {
    switch (path[0]) {
      case "tasks":
        return await createTask(body);
      case "habits":
        if (path[1] === "toggle") return await toggleHabit(body);
        return await createHabit(body);
      case "weekly":
        if (path[1] === "toggle") return await toggleWeekly(body);
        return await createWeekly(body);
      case "monthly":
        return await createMonthly(body);
      case "yearly":
        if (path[1] === "milestone") return await addMilestone(body);
        return await createYearly(body);
      case "food":
        return await upsertFood(body);
      case "money":
        return await upsertMoney(body);
      case "notes":
        return await upsertNote(body);
      case "seed":
        return await seed();
      case "settings":
        return await updateSettings(body);
      default:
        return notFound();
    }
    });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(request, { params }) {
  const { path = [] } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    return await authed(request, async () => {
    if (path[0] === "tasks" && path[1]) {
      const set = pickFields(body, ["title", "category", "priority", "notes", "time", "date"]);
      if (body.completed !== undefined) {
        set.completed = !!body.completed;
        set.completedAt = body.completed ? now() : null;
      }
      if (!Object.keys(set).length) {
        return json(await coll("tasks").then((c) => c.findOne({ id: path[1] })));
      }
      const result = await coll("tasks").then((c) =>
        c.findOneAndUpdate({ id: path[1] }, { $set: set }, { returnDocument: "after" })
      );
      const doc = docOf(result);
      if (!doc) return notFound();
      return json(doc);
    }
    if (path[0] === "monthly" && path[1]) {
      const set = pickFields(body, ["name", "notes", "category", "month", "emoji"]);
      if (body.completed !== undefined) {
        set.completed = !!body.completed;
        set.completedAt = body.completed ? now() : null;
      }
      if (!Object.keys(set).length) {
        return json(await coll("monthlyGoals").then((c) => c.findOne({ id: path[1] })));
      }
      const result = await coll("monthlyGoals").then((c) =>
        c.findOneAndUpdate({ id: path[1] }, { $set: set }, { returnDocument: "after" })
      );
      const doc = docOf(result);
      if (!doc) return notFound();
      return json(doc);
    }
    if (path[0] === "yearly" && path[1]) {
      if (body.milestoneId) {
        const goal = await coll("yearlyGoals").then((c) => c.findOne({ id: path[1] }));
        if (!goal) return notFound();
        const milestones = (goal.milestones || []).map((m) =>
          m.id === body.milestoneId ? { ...m, done: body.done !== undefined ? !!body.done : !m.done } : m
        );
        const result = await coll("yearlyGoals").then((c) =>
          c.findOneAndUpdate({ id: path[1] }, { $set: { milestones } }, { returnDocument: "after" })
        );
        return json(docOf(result));
      }
      const set = pickFields(body, ["name", "description", "category", "target", "deadline", "notes", "progress"]);
      if (set.target !== undefined) set.target = set.target === "" || set.target === null ? null : Number(set.target);
      if (set.progress !== undefined) set.progress = Number(set.progress) || 0;
      if (!Object.keys(set).length) {
        return json(await coll("yearlyGoals").then((c) => c.findOne({ id: path[1] })));
      }
      const result = await coll("yearlyGoals").then((c) =>
        c.findOneAndUpdate({ id: path[1] }, { $set: set }, { returnDocument: "after" })
      );
      const doc = docOf(result);
      if (!doc) return notFound();
      return json(doc);
    }
    return notFound();
    });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(request, { params }) {
  const { path = [] } = await params;
  const q = new URL(request.url).searchParams;
  try {
    return await authed(request, async () => {
    if (path[0] === "seed") {
      const names = ["tasks", "habits", "habitCompletions", "weeklyGoals", "weeklyCompletions", "monthlyGoals", "yearlyGoals", "foodEntries", "moneyEntries", "dailyNotes"];
      for (const name of names) {
        await coll(name).then((c) => c.deleteMany({}));
      }
      return json({ ok: true });
    }
    if (path[0] === "tasks" && path[1]) {
      await coll("tasks").then((c) => c.deleteOne({ id: path[1] }));
      return json({ ok: true });
    }
    if (path[0] === "habits" && path[1]) {
      await coll("habits").then((c) => c.deleteOne({ id: path[1] }));
      await coll("habitCompletions").then((c) => c.deleteMany({ habitId: path[1] }));
      return json({ ok: true });
    }
    if (path[0] === "weekly" && path[1]) {
      await coll("weeklyGoals").then((c) => c.deleteOne({ id: path[1] }));
      await coll("weeklyCompletions").then((c) => c.deleteMany({ goalId: path[1] }));
      return json({ ok: true });
    }
    if (path[0] === "monthly" && path[1]) {
      await coll("monthlyGoals").then((c) => c.deleteOne({ id: path[1] }));
      return json({ ok: true });
    }
    if (path[0] === "yearly" && path[1] && path[2] === "milestone" && path[3]) {
      const goal = await coll("yearlyGoals").then((c) => c.findOne({ id: path[1] }));
      if (goal) {
        await coll("yearlyGoals").then((c) =>
          c.updateOne(
            { id: path[1] },
            { $set: { milestones: (goal.milestones || []).filter((m) => m.id !== path[3]) } }
          )
        );
      }
      return json({ ok: true });
    }
    if (path[0] === "yearly" && path[1]) {
      await coll("yearlyGoals").then((c) => c.deleteOne({ id: path[1] }));
      return json({ ok: true });
    }
    if (path[0] === "food") {
      await coll("foodEntries").then((c) => c.deleteOne({ date: safeDate(q.get("date"), "") }));
      return json({ ok: true });
    }
    if (path[0] === "money") {
      await coll("moneyEntries").then((c) => c.deleteOne({ date: safeDate(q.get("date"), "") }));
      return json({ ok: true });
    }
    return notFound();
    });
  } catch (e) {
    return fail(e);
  }
}
