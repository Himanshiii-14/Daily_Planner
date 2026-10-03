# My Little Life

A personal planner for daily tasks, habits, weekly / monthly / yearly goals, a food diary, money tracking, notes, and a calendar. Everything is stored in MongoDB. The browser talks only to this Next.js app.

## What you need

- **Node.js 18.12 or newer** (this is enough to run `npm install`)
- **MongoDB 6 or 7**, listening on port `27017`
- npm (comes with Node)

Next.js 15 needs Node 18.18 or newer. This project installs Node 22 locally (`node` in devDependencies) and `npm run dev` / `npm run build` / `npm start` use that copy, so an older system Node still works.

No separate backend process. API routes live in `app/api/[[...path]]/route.js`.

## 1. Start MongoDB

Pick one option.

**Docker** (from this folder):

```bash
docker compose up -d
```

That starts MongoDB 7 and keeps the data in a Docker volume.

**MongoDB already installed on Windows:**

Start the MongoDB service, or run `mongod`. The default address `mongodb://127.0.0.1:27017` is already set in `.env`.

## 2. Configure the database

`.env` is already filled for a local database:

```
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=mylittlelife
```

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection string. For Atlas, paste the `mongodb+srv://...` URI here. |
| `DB_NAME` | Database name. It is created on the first request. Default: `mylittlelife`. |

If you use a username and password:

```
MONGO_URL=mongodb://USER:PASSWORD@127.0.0.1:27017
```

Copy `.env.example` to `.env` if `.env` is missing. Restart `npm run dev` after you change it.

## 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production:

```bash
npm run build
npm start
```

## First visit

The app creates a settings document the first time it talks to MongoDB.

- **Default PIN:** `1234`
- **Default name:** Himanshi (change it in Settings)

The PIN is stored as a hash. The unlock cookie is `httpOnly` and lasts one year.

## Sample data

Settings → **Add sample data** fills habits, tasks, goals, food, money, and notes only when those collections are empty.

**Reset planner data** deletes those entries and keeps your name and PIN.

## What is stored

| Collection | Contents |
| --- | --- |
| `settings` | Name, PIN hash, session token |
| `tasks` | Daily tasks |
| `habits` / `habitCompletions` | Habits and the days you completed them |
| `weeklyGoals` / `weeklyCompletions` | Weekly targets and occurrences |
| `monthlyGoals` | One document per goal per month |
| `yearlyGoals` | Yearly goals, progress, milestones |
| `foodEntries` | One food diary per date |
| `moneyEntries` | One money check-in per date |
| `dailyNotes` | One note per date |

Streaks, weekly counts, and yearly totals are calculated on the server from those collections, so Home, Today, and the year view stay in sync.
