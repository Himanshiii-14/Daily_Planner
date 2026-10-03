const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

const base = "http://localhost:3000";
const stamp = Date.now();
const accounts = [
  { name: "Ava Test", email: `ava.${stamp}@example.com`, password: "planner-pass-a" },
  { name: "Bea Test", email: `bea.${stamp}@example.com`, password: "planner-pass-b" },
];

function client() {
  const jar = new Map();
  return async function request(url, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const response = await fetch(base + url, { ...opts, headers });
    for (const cookie of response.headers.getSetCookie?.() || []) {
      const [pair] = cookie.split(";");
      const eq = pair.indexOf("=");
      const key = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (!value) jar.delete(key);
      else jar.set(key, value);
    }
    const text = await response.text();
    let body = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* html */
    }
    return { status: response.status, body };
  };
}

async function main() {
  const mongo = new MongoClient(env.MONGO_URL, { serverSelectionTimeoutMS: 8000 });
  await mongo.connect();
  const db = mongo.db(env.DB_NAME || "melife");
  const users = db.collection("users");
  const before = await users.countDocuments();
  let holdId = null;
  if (before === 0) {
    holdId = `hold-${stamp}`;
    await users.insertOne({
      id: holdId,
      name: "Hold",
      email: `hold.${stamp}@example.com`,
      passwordHash: "unused",
      createdAt: new Date().toISOString(),
    });
  }
  const unownedBefore = await db.collection("tasks").countDocuments({ userId: { $exists: false } });

  const a = client();
  const b = client();
  const signupA = await a("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(accounts[0]),
  });
  const signupB = await b("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(accounts[1]),
  });
  const taskA = await a("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: `isolation-a-${stamp}`, date: "2026-10-03" }),
  });
  const bootB = await b("/api/bootstrap?today=2026-10-03");
  const taskB = await b("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: `isolation-b-${stamp}`, date: "2026-10-03" }),
  });
  const bootA = await a("/api/bootstrap?today=2026-10-03");
  const titles = (body) => (body?.tasks || []).map((task) => task.title);
  const aTitles = titles(bootA.body);
  const bTitles = titles(bootB.body);
  const leakedToB = bTitles.some((title) => title.includes(`isolation-a-${stamp}`));
  const leakedToA = aTitles.some((title) => title.includes(`isolation-b-${stamp}`));
  const aSeesOwn = aTitles.includes(`isolation-a-${stamp}`);
  const bSeesOwn = titles((await b("/api/bootstrap?today=2026-10-03")).body).includes(`isolation-b-${stamp}`);

  await db.collection("tasks").deleteMany({ title: { $in: [`isolation-a-${stamp}`, `isolation-b-${stamp}`] } });
  const testEmails = [...accounts.map((account) => account.email), holdId ? `hold.${stamp}@example.com` : null].filter(Boolean);
  const testUsers = await users.find({ email: { $in: testEmails } }).toArray();
  const ids = testUsers.map((user) => user.id);
  await db.collection("sessions").deleteMany({ userId: { $in: ids } });
  await users.deleteMany({ id: { $in: ids } });
  const unownedAfter = await db.collection("tasks").countDocuments({ userId: { $exists: false } });
  await mongo.close();

  const report = {
    signupA: signupA.status,
    signupB: signupB.status,
    taskA: taskA.status,
    taskB: taskB.status,
    aSeesOwn,
    bSeesOwn,
    leakedToA,
    leakedToB,
    unownedBefore,
    unownedAfter,
    usersLeft: await Promise.resolve(before),
  };
  console.log(JSON.stringify(report));
  if (signupA.status !== 200 || signupB.status !== 200 || !aSeesOwn || !bSeesOwn || leakedToA || leakedToB || unownedBefore !== unownedAfter) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
