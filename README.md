# WYBSL Scheduling Studio

A self-contained, browser-based scheduling prototype based on `WYBSL_Scheduling_Engine_Discovery.md`.

## Run locally

```bash
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). No install step is required.

## Demo scope

- Configures the Spring 2026 season, all 11 league rows, the source team counts (91 teams total, including the disabled one-team Black Hat row), and the 28 records supplied by `fields.json`.
- Uses division-specific date windows, day/time slots, and field assignments transcribed from `spring_2026_schedule_rules.png`.
- Generates a balanced 540-game draft for the ten schedulable leagues, giving every active team twelve games by default, and reports games that cannot fit instead of silently relaxing source constraints.
- Enforces a maximum two-game home/away difference (6–6 or 7–5 for a 12-game season) and supports an explicit per-league game-count override.
- Runs a marked recovery pass for initial failures: it first searches other dates on assigned fields, then considers nonstandard fields and days while preserving team, occupancy, daylight, and operating-hour safety rules.
- Displays the selected recovery, original blocker, and alternate candidates; adjusted games are highlighted in calendar/list views and identified in CSV exports.
- Treats configured days as flexible availability and spreads games across one- and two-game weeks while strongly avoiding back-to-backs. Saturday and Sunday are used only for Co-ed Tee-ball I under the source rules.
- Reviews the schedule by calendar, game list, and team summary.
- Imports an existing CSV into the local planning copy.
- Handles rainouts game-first: choose a scheduled date, select individual games, and optionally close a field to include every game there.
- Drafts Saturday makeups at 10:00 AM, 1:00 PM, or 4:00 PM and Sunday makeups at 1:00 PM or 4:00 PM before considering a clearly labeled weekday fallback.
- Keeps unaffected games locked, names the game/division/teams for unresolved assignments, and marks applied makeups for review throughout the schedule.
- Records local approval and exports schedule/change-list CSV files.
- Stores state only in browser `localStorage`.

The prototype has no database, backend persistence, authentication, deployment configuration, or connection to the existing WYBSL scheduling service. Exporting or approving never publishes a schedule.

All times are fixed to Eastern Time. Weekend games begin at 10:00 AM by default.

## Verify

```bash
npm test
```

The tests verify the Spring 2026 source mapping, division date windows, exact start times, assigned fields, daylight, and absence of team or field overlaps.
