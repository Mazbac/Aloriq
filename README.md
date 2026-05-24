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
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:reset
```

## MVP1.1 Manual QA

1. Run `npm run db:reset`.
2. Visit `/dashboard` and confirm it redirects to `/setup`.
3. Skip setup and confirm the dashboard shows the setup incomplete warning.
4. Return to `/setup` and complete:
   - choose top values
   - add criterion
   - create draft goal
   - add recommended metric stack
   - add weekly commitment
   - finish setup
5. Open the goal detail page.
6. Confirm the activation checklist is complete.
7. Activate the goal.
8. Log a metric entry.
9. Run a breakdown.
10. Create a weekly review.
11. Confirm the review appears in review history.
12. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

## MVP Assumptions

- Auth is intentionally omitted. The app uses one seeded demo user.
- SQLite is used for local development.
- External tools are stored as URLs only. There are no integrations.
- Weekly commitments are the only execution-level commitments in MVP1.
- Metrics are manually updated.
- AI coaching, gamification, full calendars, task management, habit tracking, finance tracking, calories/macros, CRM, and social features are out of scope.
- MVP2 starts after MVP1 has been tested with real users. Do not add MVP2 features until the core loop has been validated.
