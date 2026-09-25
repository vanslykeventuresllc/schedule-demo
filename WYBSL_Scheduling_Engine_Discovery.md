# WYBSL Scheduling Engine — Product & Technical Discovery

**Project:** VanSlyke Ventures, LLC / WYBSL Mobile v2  
**Status:** Discovery and technical exploration; not an approved implementation specification  
**Target:** Scheduling capabilities available in time to prepare the Spring 2027 season  
**v2 context:** Messaging, Scheduling, and Registration are the three major initiatives. This document covers **Scheduling only**.

## 1. Executive summary

Build an administrator-facing scheduling assistant that (1) generates a balanced regular-season schedule and (2) proposes makeup dates after cancellations, especially rainouts. It should validate division rules, field compatibility, daylight, team conflicts, and officiating needs; explain infeasible cases; and let an administrator review, adjust, and approve results. The initial workflow **assists the existing WYBSL scheduling service** rather than replacing it or automatically publishing changes.

The underlying engine should be **sport-agnostic** (events, participants, resources, constraints, officials), but **WYBSL baseball/softball is the only delivery target for v2**. Soccer or other customers are a possible future application, not part of the Spring 2027 scope. Avoid building multi-tenant SaaS, soccer-specific UI, or generic rule-language tooling now.

**Success hypothesis:** Reduce hands-on schedule creation and rainout-repair effort substantially; **75%+ time savings is an aspirational metric to measure**, not a promised outcome. Software cannot manufacture missing fields, daylight, or qualified officials.

## 2. Known league facts and assumptions

| Item | Current understanding | Confidence / follow-up |
|---|---|---|
| Divisions | 11 across tee-ball, baseball, softball | From supplied division image; confirm current spring offerings |
| Teams | 6 per division; 66 total | Planning assumption; verify actual registration counts |
| Fields | Approximately 20, league-controlled | Obtain inventory and compatibility map |
| Other users of fields | No competing organizations; games take priority over practices | Practice conflicts are lower priority but may need notification |
| Season | 10 games per team across 5–6 weeks | Confirm dates, holidays, playoffs, division-specific exceptions |
| Game count | 330 games if 66 teams each play 10 games | 66 × 10 ÷ 2; excludes playoffs and additional games |
| Weekly load | 55 games/week over 6 weeks or 66 over 5 weeks | Averages; real distribution may vary |
| Normal game days | Division-specific days from league rules | Confirm latest authoritative division chart |
| Normal weekly frequency | Typically 2 games/team/week on designated days | A 6-week season requires some 1-game weeks, breaks, or other distribution |
| Makeup days | May occur outside normal days; prefer weekends, particularly Sunday | Preference, not guarantee; weekend weather can also cancel games |
| Doubleheaders | Prohibited by default; administrator may explicitly override | Define override scope, audit trail, and minimum turnaround |
| Start times | Earliest weekday start: spring 6:00 PM, fall 5:00 PM | Clarify weekend starts and whether these apply to all divisions |
| Lights | No fields have lights | Need date-specific usable-daylight cutoff and buffer |
| Home/away and game times | Balanced evenly | Define exact fairness targets and acceptable deviation |
| Coach overlap | No known multi-team coach conflicts | Could be supported later as generic constraint |
| Umpires | Some older divisions require trained/certified officials | Exact count per game, credentials, and available pool unknown |
| Current schedule system | Existing service remains in use | Determine authoritative source and import/export format |
| External write API | Not available for this project | Do not assume automated synchronization or publishing |
| Cancellations and notifications | Managed manually today | MVP can produce approved change lists; notifications out of scope unless separately approved |

### Matchup arithmetic

For a six-team division, a single round robin is 15 games; a double round robin is **30 games**, giving each team ten games and two meetings against each opponent. Across 11 divisions this is **330 games**. A double round robin is a natural default **if** each division wants every opponent twice; confirm that this is policy rather than assuming it universally. Three games are needed for each full six-team round.

## 3. Division rule seed data

The following was transcribed/interpreted during discovery from the supplied league chart. **Verify against the authoritative chart before implementation**, particularly any ambiguous columns, game durations, umpire headcounts, and whether days are mandatory or preferred.

| Sport | Division | Normal days | Innings | Official qualification indicated |
|---|---|---|---:|---|
| Tee-ball | Tee-Ball I | Sat, Sun | 2 | Volunteer |
| Tee-ball | Tee-Ball II | Mon, Wed, Fri | 4 | Volunteer |
| Softball | 8U | Tue, Wed, Thu | 6 | Volunteer |
| Softball | 10U | Mon, Wed, Fri | 6 | Trained |
| Softball | 12U | Tue, Wed, Thu | 6 | Trained |
| Softball | 17U | Mon, Wed, Fri | 7 | Certified |
| Baseball | 8U | Tue, Wed, Thu | 6 | Volunteer |
| Baseball | 10U | Mon, Wed, Fri | 6 | Trained |
| Baseball | 12U | Tue, Wed, Thu | 6 | Trained |
| Baseball | 14U | Mon, Wed, Fri | 7 | Certified |
| Baseball | 18U | Varies; 2–3 games/week | 7 | Certified |

**Do not confuse innings with scheduling duration.** Actual time limits, expected elapsed duration, warmups, turnover, and rules about starting another inning must be captured separately. Field dimensions and pitching-distance requirements should be taken from the current league rules and modeled as field-compatibility capabilities; do not assume a field needs an exact dimension match if it can be reconfigured. Pitch-count restrictions are relevant for player usage and short-rest alerts but are not automatically enforceable in a future-game scheduler without pitcher assignments.

## 4. Product boundaries

### In scope for scheduling MVP

- Admin-managed organization/season/division/team/field configuration for WYBSL.
- Field capabilities, supported divisions, operating hours, closures, and date-specific daylight restrictions.
- Configurable scheduling rules and priorities with a **limited, typed rule catalog**, not arbitrary user-written logic.
- Matchup creation and full regular-season draft generation for configured divisions.
- Import or manually enter the existing published schedule for makeup planning; preserve original game IDs where possible.
- Batch postpone/cancel selection and candidate makeup generation, with weekend/Sunday preferences.
- Umpire qualification and capacity checks **if sufficient data is available**; otherwise clearly label coverage *unverified*, not *confirmed*.
- Conflict explanations, feasibility diagnostics, administrator overrides, versioned drafts, review and approval.
- CSV/export or administrator-friendly change list compatible with the current service; exact format is a discovery dependency.
- Historical-season pilot and measured admin time savings.

### Explicitly out of scope unless separately approved

- Replacing the existing WYBSL schedule system or claiming it is the source of truth.
- Automatic writing/publishing to the current system, automated push notifications, and guaranteed real-time synchronization.
- Individual umpire acceptance/decline, payroll, payments, and full umpire workforce management (possible follow-on).
- Soccer-specific features, multi-organization customer onboarding, tenant billing, generic SaaS administration.
- Fully automated cancellation decisions based on weather forecasts.
- Registration and messaging implementation (separate v2 workstreams, though future integrations should be anticipated).

## 5. Domain model (sport-agnostic core)

Use generic scheduling concepts in core logic and sport-specific configuration at the edges.

- **Organization:** WYBSL now; logical ownership boundary for future reuse.
- **Season:** dates, timezone, sport(s), holidays, deadlines, operating policy.
- **Division:** game count, round-robin policy, duration, eligible days, official requirements, field capability requirements, fairness rules.
- **Team / participant:** division membership, blackouts, home designation, schedule.
- **Event / game:** stable ID, participants, division, duration, state, scheduled slot, assigned resources, provenance.
- **Facility / resource:** complex, field/court, capabilities, opening windows, daylight/lights, blackouts, optional parent-child exclusivity.
- **Official / resource pool:** credentials, eligibility, availability, maximum workload, assignment status; may initially be represented by aggregate capacity.
- **Rule:** typed predicate, scope, hard/soft status, priority/weight, override policy, version.
- **Schedule version / proposal:** baseline, proposed assignments, affected games, violations, approvals, export status.
- **Change / audit record:** previous slot, proposed slot, reason, approver, override, timestamps.

For future soccer support, a parent pitch might be subdivided into two child pitches: booking the whole parent blocks both children, while booking one child need not block the other. This is a **design allowance**, not a requirement to build a soccer facility editor for v2.

## 6. Rules engine

### Hard constraints — never silently violated

1. Each required game is scheduled at most once in a draft; each scheduled game has exactly one valid start, duration, and compatible field.
2. No overlapping use of the same field or mutually exclusive parent/child resources; include setup/turnover buffers.
3. No team plays overlapping games or more than one game per day unless an explicit authorized override permits a doubleheader.
4. Game falls within the facility's allowed operating window and ends before configured usable-daylight cutoff (including safety buffer).
5. Field is eligible for the division's requirements and available on that date.
6. Regular-season matchups and per-team game totals meet the configured season format.
7. Required qualified official coverage is feasible/assigned when such data is known. Unknown availability is **not** confirmation.
8. Honor closures, blocked dates, and any genuinely mandatory division day restrictions.
9. Do not modify locked/published games without explicit permission.

### Soft constraints — optimize among valid solutions

- Balance home/away, early/late slots, and opponents across teams.
- Favor normal division days for regular-season games.
- For makeup games, prefer weekends, particularly Sunday when other conditions are equal; fall back to normal division days and then other allowed days.
- Minimize changes to already published games; minimize number of affected teams/officials and total date displacement.
- Avoid consecutive-day games and repeat opponents too close together where possible.
- Preserve reasonable rest/travel/turnover and avoid overloading officials.
- Keep spare capacity for future makeups when practical; allow admin to choose the tradeoff.

**Rule precedence:** hard safety/eligibility constraints first; administrator-authorized exceptions must be explicit, narrow, and logged. Soft preference weights should be configurable and exposed in the proposal report. A solver must report *infeasible* rather than quietly discarding hard rules.

### Season-length nuance

Five weeks × two games/team/week = ten games/team. Six weeks × two games/team/week = twelve, so for six weeks the weekly distribution must be configurable (e.g., four two-game weeks and two one-game weeks, or other valid pattern). Clarify whether the league's "two games per week" is a strict cap, typical target, or requirement for every active week.

## 7. Regular-season generator

1. Load versioned configuration and current field/official availability.
2. Generate required matchups: for six teams, default to double round robin **only after confirming the desired opponent policy**.
3. Generate candidate field/time slots from facility windows, game duration, turnover, and date-specific usable daylight.
4. Solve game-to-slot/resource assignments jointly across divisions; account for scarce compatible fields and certified-official capacity early.
5. Optimize fairness and operational preferences; allow bounded solve time and return the best valid draft found, or an infeasibility report.
6. Produce a draft calendar, team-by-team views, field utilization, home/away and time-of-day distributions, umpire coverage status, and rule/override report.
7. Administrator reviews, edits, approves, and exports the schedule to the existing service.

Do **not** simply schedule divisions sequentially into the first open slots: that can strand constrained older divisions with no usable field or official capacity. A CP-SAT / constraint optimization approach (e.g., Python + Google OR-Tools) is worth prototyping; benchmark actual season data before committing to solver architecture or performance claims.

## 8. Rainout and schedule-repair workflow

1. Import the current authoritative schedule (or manually update the assistant's local copy); show data freshness and import version.
2. Administrator marks one or many games postponed and optionally closes affected fields/time windows.
3. Treat unaffected published games as locked by default; generate valid replacement candidates **for the batch together**, not independently in a greedy order.
4. Apply normal hard constraints, including team conflicts, daylight, field eligibility, and known umpire requirements.
5. Prefer weekend/Sunday makeups; consider normal days and other permitted days if weekends are unavailable or at risk.
6. Rank valid proposals by minimal disruption and configured preferences; show the specific games, teams, fields, and officials affected.
7. If none are feasible, explain the blockers and show admin-controlled alternatives: another date, relax a soft preference, permit a specific doubleheader, unlock another game, extend the season, or accept an unresolved game. Do not automatically relax safety constraints.
8. Admin approves a proposal; export a **change set** (game ID, previous slot, new slot, field, status, rationale, umpire coverage) for entry into the existing service.
9. Mark proposal as exported/pending external confirmation; do not claim the external schedule changed until verified.

**Rain-on-Sunday edge case:** A makeup weekend can itself be canceled. Keep postponed games in a backlog, retain their stable IDs/history, and rerun the batch repair against the latest confirmed schedule. Avoid endless cascading changes by minimizing edits and protecting published games.

## 9. Umpires: phased handling

Known: certain older divisions require trained/certified umpires. Unknown: number per game, credential equivalencies, actual roster, daily availability, who assigns them, and acceptance workflow.

- **MVP baseline:** division-specific required count/qualification; admin-entered available qualified capacity per slot or individual availability if obtainable; flag conflicts and label unverified assignments clearly.
- **Later:** individual official profiles, certification expiry, assignments, conflicts, confirmations, declines, replacement suggestions, payments if desired.
- **Critical:** a field/team-valid game is not necessarily operationally playable without officials. If umpire data is missing, show a provisional schedule with a visible staffing warning; never represent it as fully validated.

## 10. Administrator interface (initial screens)

1. **Season setup:** dates, divisions, teams, games/team, normal days, weekly frequency, weekends, holidays, field hours.
2. **Fields/resources:** ~20 fields, compatibility, reconfiguration/turnover, closures, daylight restrictions.
3. **Rules & priorities:** required vs preferred settings; explicit doubleheader override control.
4. **Schedule import:** CSV mapping/validation, source timestamp, stable IDs, duplicate/conflict report.
5. **Generate & review:** draft calendar, per-team and per-field views, fairness metrics, unassigned games, official coverage, rule explanations.
6. **Rainout workbench:** select canceled games, close facilities, generate candidate repairs, compare impact.
7. **Approval & export:** versioned approved draft/change list, audit trail, external update status.

Useful statuses: `draft`, `proposed`, `approved`, `exported`, `externally_confirmed`, `postponed`, `canceled`, `completed`. Separate *game status* from *proposal/export status* in the data model.

## 11. Integration boundary with the existing WYBSL system

The current scheduling service remains authoritative. The new tool is a **planning and export assistant**; no external write API is available in the current scope. Discover how schedules are entered, whether CSV import/export exists, and whether game IDs survive exports. If there is no import capability, provide a human-readable change list optimized for manual entry.

Important risks: stale imported schedule, manual edits made after import, duplicate game creation, conflicting versions, and misleading "published" UI. Before finalizing a repair, require reconciliation against the latest available external schedule, or display a prominent manual verification requirement. Messaging and registration are separate v2 initiatives; do not depend on either for MVP scheduling.

## 12. Technical exploration

Suggested starting stack, subject to prototyping:

- **Admin UI:** React / Next.js, desktop-first calendar and review workflows.
- **Data:** PostgreSQL / Supabase, with organization boundary, versioned configurations, audit records, and proposal state.
- **Optimization:** Python service using OR-Tools CP-SAT (or evaluate alternatives against real data).
- **API:** Typed service boundary for configuration, validation, draft generation, repair, approval, and export.
- **Jobs:** asynchronous solver jobs with progress, timeout, cancellation, deterministic seed where applicable, and reproducible input snapshots.
- **Repository:** separate scheduling repository/service from WYBSL Mobile; keep core sport-neutral, league-specific config and export adapters at edges.

Possible structure:

```text
scheduling/
  core/            # event, participant, resource, time-slot model
  rules/           # typed hard/soft constraints and validation
  optimizer/       # season generation and repair
  data/            # persistence, imports, versions, audit
  api/             # typed service endpoints and job lifecycle
  admin/           # configuration, calendar, rainout workbench
  integrations/    # WYBSL import/export adapters
  tests/           # fixtures, invariants, historical scenarios
```

Do not overbuild multi-tenancy or a universal drag-and-drop rules language for the Spring deliverable. Preserve a clean organization boundary and avoid hardcoding `baseball` into core entities.

## 13. MVP delivery and sequencing

**Scope is part of WYBSL Mobile v2**, alongside Messaging and Registration, but this workstream should have its own acceptance criteria and Spring scheduling deadline. Pricing, milestone dates, and final scope have **not** been agreed here.

1. **Discovery / data acquisition:** obtain authoritative division rules, field map, actual game durations, umpire requirements, historical schedule and rainout records, existing-service import/export procedure, spring schedule-build deadline.
2. **Rules + import foundation:** create sport-neutral model, field/calendar validation, division configuration, schedule import and conflict reporting.
3. **Historical proof of concept:** generate or repair a real past season; measure validity, feasible makeup coverage, solve time, and admin effort.
4. **Regular-season draft generation:** 10-game season, five/six-week options, fairness metrics, review and export.
5. **Makeup workbench:** batch rainouts, weekend preference, minimal-disruption repair, override/audit, export change sets.
6. **Pilot before schedule-build deadline:** run against actual Spring 2027 requirements, reconcile with existing system, train administrators, maintain manual fallback.

A smaller early proof of concept may prioritize rainout repair using imported historical schedules, but **the intended Spring scheduling deliverable includes both season creation and makeup assistance**, subject to agreed feasibility and timeline.

## 14. Acceptance criteria / test scenarios

- For a valid six-team, ten-game double round robin, each team has ten games; every opponent pair meets twice; division total is 30 games.
- Across 11 such divisions, total is 330 games, excluding postseason/extras.
- No field/team overlaps or unauthorized same-day doubleheaders; no game exceeds configured usable daylight.
- Every game uses a division-compatible field; parent/child resource collisions are rejected if that feature is enabled.
- Home/away and early/late distribution are reported, with configured fairness targets and deviations.
- A five-week schedule supports two games/team/week; a six-week schedule does not incorrectly require twelve games/team.
- A single rainout yields valid candidate dates where capacity exists; batch rainouts are evaluated jointly.
- A rainy makeup Sunday can be postponed again without losing game history or duplicating the matchup.
- No-feasible-solution cases return actionable blockers rather than invalid schedules.
- Official coverage is either verified against supplied data or explicitly marked unknown/provisional.
- An admin-approved doubleheader override is limited to the chosen game/team/date and is audit logged.
- Existing published games remain unchanged by default during repair.
- Exported change lists identify original game IDs and do not imply that the external schedule was updated.
- Historical pilot compares admin hours for initial creation, makeup repair, and corrections; measure the 75%+ time-savings aspiration empirically.

## 15. Open questions / decisions to resolve

**Must answer before reliable implementation:**

1. Exact Spring 2027 schedule creation deadline, Opening Day, holidays, playoff deadline, and division participation counts.
2. Authoritative field list: name/ID, eligible divisions, dimensions/configurations, setup time, field-specific restrictions, closures.
3. Division-by-division game duration, hard time limit, turnover, and latest acceptable finish; weekend operating windows and Sunday restrictions.
4. Are listed division days hard requirements for normal games or strong preferences? Are two games/week a hard maximum, default target, or strict requirement? What is the six-week distribution policy?
5. Are double-round-robin pairings required for every six-team division? How should odd team counts, byes, interleague play, and special divisions work?
6. Umpire count and credential requirements per division; number available by day/time; whether individual assignment is required for Spring.
7. Existing scheduling system's source of truth, export/import formats, stable game IDs, and exact administrator update workflow.
8. Makeup rules: how many games/week are permitted during recovery, how much rest is required, whether other weekdays are allowed, and who can authorize exceptions.
9. Home/away definition and exact balancing targets; early/late fairness across divisions and fields.
10. Who owns scheduling approval, who can override rules, and how to reconcile external edits before export.

**Useful but can be deferred:** individual umpire confirmations, weather feeds, coach/sibling conflicts, practice displacement notices, multi-sport facility hierarchy UI, direct integrations, multi-organization onboarding.

## 16. Risks and mitigation

| Risk | Mitigation |
|---|---|
| Not enough daylight/fields/officials | Preflight capacity analysis, infeasibility explanations, explicit admin alternatives |
| Incorrect rule chart or game durations | Versioned configuration and administrator sign-off before generation |
| Existing system diverges from imported copy | Timestamped imports, stable IDs, reconciliation and manual verification before applying changes |
| Rainouts cascade into full calendar churn | Lock unaffected games by default, optimize batch repair for minimal disruption |
| Umpire data missing | Clearly provisional staffing status; do not claim coverage |
| Scope expansion into universal SaaS | Build neutral core, but ship only WYBSL workflows and required rule types |
| Spring deadline missed | Historical pilot early; manual scheduling fallback; prioritize operational readiness before cosmetic polish |
| 75% time savings not realized | Baseline current admin effort and measure by workflow after pilot |

## 17. First VS Code exploration tasks

1. Draft SQL/TypeScript schemas for `organization`, `season`, `division`, `team`, `resource`, `resource_capability`, `availability`, `game`, `schedule_version`, `rule`, `official_requirement`, and `change_set`.
2. Create a **synthetic** six-team division fixture and a 20-field compatibility fixture; do not invent these as real WYBSL field data.
3. Write pure validation functions for team overlap, field overlap, daylight, division-day policy, doubleheaders, and game-count consistency.
4. Prototype double-round-robin matchup generation and five/six-week distribution.
5. Prototype a repair solver that accepts a baseline schedule plus postponed game IDs, locks unaffected games, and returns feasible options or blockers.
6. Add property/invariant tests and a small admin-facing JSON/CSV output before building the full UI.
7. Replace synthetic inputs with approved historical WYBSL data and benchmark.

### Suggested first engineering prompt

> Read this document as discovery context, not as finalized requirements. Propose a sport-agnostic domain model and a minimal, testable scheduling-core prototype for WYBSL. Separate confirmed facts from assumptions and open questions. Implement a six-team double-round-robin fixture, field/time-slot validator, and batch rainout-repair interface using synthetic data. Do not build soccer-specific features, multi-tenant SaaS, direct WYBSL publishing, or individual umpire payroll. Show infeasible cases explicitly and keep all overrides auditable.
