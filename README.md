# Aloriq

Aloriq is an MVP goal alignment and tracking app. It helps a demo user define life domains, values, criteria, structured goals, metrics, weekly commitments, breakdowns, and reviews without becoming a task manager or specialist tracker.

## Local Setup

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Useful Commands

```bash
npm run typecheck
npm run build
npm run db:reset
```

## MVP Assumptions

- Auth is intentionally omitted. The app uses one seeded demo user.
- SQLite is used for local development.
- External tools are stored as URLs only. There are no integrations.
- Weekly commitments are the only execution-level commitments in MVP1.
- Metrics are manually updated.
- AI coaching, gamification, full calendars, task management, habit tracking, finance tracking, calories/macros, CRM, and social features are out of scope.
