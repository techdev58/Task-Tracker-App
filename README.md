# Intern Task & Attendance Tracker

A single Next.js app (frontend + API routes) for managing internship batches: a reusable task
catalog, batch-wide task assignment with per-intern progress tracking, attendance, completion
reports with danger-zone flagging, and mentor reviews. No login — the app is operated by an
admin/mentor on behalf of interns.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript, Tailwind CSS
- **MongoDB + Mongoose** for data storage
- **zod** for API input validation
- **date-fns** for week/month period calculations

## Database

The app requires a MongoDB connection string in `MONGODB_URI` — there is no local/in-memory
fallback. Copy `.env.example` to `.env.local` and set it to your MongoDB Atlas (or self-hosted)
connection string, including a database name:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/<database-name>?retryWrites=true&w=majority&appName=<app-name>
```

`.env.local` is gitignored — never commit real credentials. When deploying, set `MONGODB_URI`
as an environment variable on your hosting platform (e.g. Vercel Project Settings → Environment
Variables) rather than shipping it in the repo.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start by creating a batch, then add
interns, tasks, and task assignments from the UI.

## Data Model

- **Batch** — a group of interns (e.g. "Summer 2026 - Web Development"), with a start/end date and status.
- **Intern** — belongs to a batch; has contact info, join date, and status (active/completed/dropped).
- **Task** — a reusable catalog entry: title, description, priority. Not tied to any batch or intern by itself.
- **TaskAssignment** — a catalog Task assigned to an entire Batch with a due date. Creating one fans out a `TaskProgress` row to every active intern in that batch (and new interns joining later automatically pick up existing assignments for their batch).
- **TaskProgress** — one row per intern per assignment: `status` (pending/in-progress/completed), `completedAt` (set automatically when marked completed, editable), and an overwritable `review` note, editable inline from the Daily Tasks tab or the intern's own Tasks tab.
- **Attendance** — one record per intern per day (present/absent/leave/half-day).
- **Review** — a mentor's star rating (1-5) and comments for an intern, optionally tied to a catalog task.

## On-Time vs Late, and Danger Zone

Every completed task is tagged **On Time** or **Late** by comparing its `completedAt` to the
assignment's due date. Credit decays the longer a submission is late, rather than a flat
penalty: `credit = 1 / (days late + 1)` — on time = 100%, 1 day late = 50%, 2 days late = 33%,
3 days late = 25%, and so on. Each intern's completion score is the sum of their per-task
credit divided by their total assigned tasks.

Interns below the danger threshold (default 50%, adjustable on the Reports page) are flagged
**Danger Zone**; the rest are **Safe**. The Dashboard breaks this down **per batch** (not one
combined pool across all interns) for the current month, and the Reports page lets you view any
week/month and batch with an on-time/late breakdown per intern.

## Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard with summary stats and per-batch danger-zone breakdown |
| `/batches` | Create/edit/delete batches |
| `/batches/[id]` | Batch detail — interns in that batch |
| `/interns` | Create/edit/delete interns, filter by batch |
| `/interns/[id]` | Intern detail — tabs for tasks (status, completed-on date, on-time/late tag, review), attendance, reviews |
| `/tasks` | Manage the reusable task catalog (title, description, priority) |
| `/daily-tasks` | Assign a catalog task to a batch (with due date); expand an assignment to set each intern's status, completion date, and review inline |
| `/attendance` | Mark daily attendance per batch (grid) |
| `/reports` | Weekly/monthly completion-score report per intern (on-time/late breakdown), with danger-zone threshold |
| `/reviews` | View/add mentor reviews, filter by intern |

## API

All routes live under `src/app/api/` and follow REST conventions:
`GET/POST /api/<entity>` and `GET/PATCH/DELETE /api/<entity>/[id]` for
`batches`, `interns`, `tasks`, `task-assignments`, `attendance`, `reviews`, plus
`GET /api/task-progress` (filter by intern), `PATCH /api/task-progress/[id]`,
`GET /api/reports` (weekly/monthly completion aggregation), and `GET /api/dashboard/stats`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint

## Deployment

This is a standard Next.js app and deploys as-is to Vercel or any Node host:

1. Set the `MONGODB_URI` environment variable on the host (do not commit `.env.local`).
2. Make sure the MongoDB Atlas cluster's network access allows connections from your host
   (Atlas → Network Access → IP Access List — add `0.0.0.0/0` for serverless hosts like Vercel,
   or the host's static IP range if available).
3. `npm run build` then `npm run start` (or let the host run these for you).
