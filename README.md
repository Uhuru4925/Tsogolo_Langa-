# MalawiGuide — MSCE Career Guidance System

A free, bilingual (English / Chichewa) web app that helps Malawian secondary
school students discover whether they are stronger in **Sciences** or
**Humanities**, get personalised career and subject recommendations, and
build a week-by-week revision timetable — all grounded in the real MSCE
curriculum and the textbook series used in Malawian schools (Excel &
Succeed, Strides in..., Achievers, Study & Master, Explore & Conquer, Arise
With, Target in...).

## Features

- **Adaptive aptitude quiz** — 30 questions per sitting, drawn from a bank of
  220+ MSCE-style questions across 8 subjects (Science, Math, Computer
  Studies, Technical Arts, Humanities, Language, Home Economics, Bible
  Knowledge), spanning three difficulty phases (Easy / Medium / Hard) and
  three cognitive levels (Recall / Apply / Analyse).
- **No repeated questions** — every student receives a uniquely generated,
  non-repeating paper; question usage is tracked so consecutive students get
  different sets.
- **Instant results & career matching** — Sciences vs Humanities breakdown,
  MSCE-style grading, and curated career paths (medicine, engineering,
  computer science, cybersecurity, law, teaching, agriculture, and more)
  mapped to real Malawian universities and colleges.
- **Personalised study planner** — turns weak subjects into a structured,
  printable revision timetable with topic-by-topic checklists.
- **Downloadable practice papers** — generate custom PDF practice papers
  (with marking schemes) filtered by subject, difficulty and thinking skill.
- **Works offline** — installable as a PWA; quiz sessions and study plans are
  cached locally, including quiz answers and elapsed time, and sync
  automatically once back online.
- **Student accounts and subject profiles** — learners create an account, save
  their school, form and subjects, and can edit their subject choices later.
- **Leaderboard** — completed account-based quiz results are ranked, and
  signed-in learners can view their best-result position.
- **Swappable data backend** — uses PostgreSQL out of the box and switches
  automatically to Firebase Firestore when Firebase Admin credentials are
  configured.
- **Shareable** — built-in QR code and link-sharing page for classrooms and
  schools.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) (optional Firestore backend)
- [pdf-lib](https://pdf-lib.js.org/) for practice paper generation
- [idb](https://github.com/jakearchibald/idb) for offline IndexedDB storage

## Getting started

### Prerequisites

- Node.js 20+
- A local PostgreSQL instance

### Setup

```bash
npm install
cp .env.example .env
# edit .env and set DATABASE_URL to your local PostgreSQL connection string

npx drizzle-kit push   # creates the database schema

npm run dev            # starts the app at http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

### Optional: switch to Firebase Firestore

1. In Firebase Console, create a project and a Firestore database.
2. Register a Web app and copy its config into the `NEXT_PUBLIC_FIREBASE_*`
   variables in `.env.local`.
3. Enable Email/Password in Authentication (Google is optional).
4. Create a service-account key and set `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` on the server, or set
   `FIREBASE_SERVICE_ACCOUNT` to the full JSON.
5. Restart the app and visit `/api/health` to confirm that Firestore is
   healthy. The app creates its `students`, `quizSessions`, `results` and
   supporting collections automatically after the first profile or quiz save.

Never expose or commit the service-account private key. Firestore collections
are managed automatically by the app; server-side Admin SDK writes bypass
Firestore Security Rules.

## Project structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                 # sessions, study-plan, papers (PDF), leaderboard, health
│   ├── quiz/                # quiz landing + per-session quiz player
│   ├── results/[sessionId]/ # results & career recommendations
│   ├── plan/[sessionId]/    # personalised study planner
│   ├── papers/               # MANEB-style practice paper generator
│   ├── leaderboard/
│   ├── share/                # QR code / link sharing
├── components/               # Quiz player, study-plan builder/tracker, offline UI
├── db/                        # Drizzle schema & connection
├── lib/
│   ├── question-bank.ts       # 220+ MSCE-style questions
│   ├── select-questions.ts    # per-student paper generation (no repeats)
│   ├── study/                  # syllabus, subject analysis, timetable planner
│   ├── storage/                 # storage-agnostic interface (Firestore ↔ Postgres)
│   └── offline/                  # IndexedDB + background sync
└── public/                        # images, manifest, service worker
```

## Database

Schema is managed with Drizzle ORM. After changing `src/db/schema.ts`, apply
the change with:

```bash
npx drizzle-kit push
```

## License

Built for Malawian secondary school students. Not affiliated with MANEB.
