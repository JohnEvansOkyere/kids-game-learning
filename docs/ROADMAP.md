# MathChampions Restructure Roadmap

Goal: kids come back because of the **game**, parents pay because of the **progress**.
Both run on one engine: every node in the kid's world is a math skill.

```
KIDS     Adventure World  (map → zones → nodes → boss, avatar, rewards)
ENGINE   Skill graph      (NaCCA indicators, mastery, adaptive difficulty)
ADULTS   Parent (pays)    |  Teacher (free, brings users)
```

---

## Phase A — Adventure World (kid retention)

Backend
- [x] Student wallet: `coins`, `equippedItem`, `lastChestAt`
- [x] `NodeProgress` model (stars 0–3, best accuracy, plays)
- [x] `StudentItem` model (owned collectibles / outfits)
- [x] World content defined in code (`app/world_content.py`): zones, nodes, items
- [x] `GET  /api/world/{studentId}` — map with locked / unlocked / completed state
- [x] `POST /api/world/{studentId}/nodes/{nodeId}/complete` — stars, coins, unlocks, first-clear reward
- [x] `POST /api/world/{studentId}/chest` — daily reward chest
- [x] `POST /api/world/{studentId}/items/{itemId}/buy` and `/equip`
- [x] Grade-based starting zone (placeholder until the Phase B diagnostic)
- [x] Tests for unlocks, stars, chest, shop

Frontend
- [x] `/play` world map: zones, node path, stars, coins, avatar with outfit
- [x] Daily chest + shop (outfits & collectibles bought with coins)
- [x] River practice runs as a node (`/practice?node=…`) and reports completion
- [x] Counting Catch & Number Pop run as nodes and report completion
- [x] Tug-of-war as zone **boss** vs a computer opponent (`/battle?node=…`)
- [x] Node result screen: stars earned, coins, "back to map"
- [x] Student select goes to `/play`; old dashboard kept as "Free Play"
- [x] Map highlights the first unplayed stage in the child's own grade zone (or later); easier zones stay open for extra coins

Validation (before anything else)
- [ ] Playtest with 15–20 kids for 2 weeks
- [x] Track day-1 return, day-7 return, sessions per week (`Event` table, `POST /api/events`, `GET /api/events/report`, `python -m scripts.retention_report`)
- [ ] Track "asked to play unprompted" (needs a short parent check-in; the app can't see it)
- [ ] Fix the loop until kids come back on their own

Polish (can run in parallel)
- [ ] Commission one consistent Ghanaian art style (characters + zone backgrounds)
- [x] Sound and juice pass: unlock animation, chest opening, coin burst
- [x] Visual design pass: design tokens, 3D buttons, Fredoka/Nunito, painted zone scenes with a winding road, HUD + bottom dock, "next goal" card, dress-up shop, sequenced reward reveal, calm parent screens (see `docs/frontend-ui.md`)
- [ ] Restyle Tug of War, Counting Catch and Number Pop screens to match (they inherit the new buttons/cards but keep their own layouts)
- [ ] Daily streak that forgives a missed day (needs a backend field; do not add a guilt-based streak)
- [ ] Haptic tick on tap (`navigator.vibrate`) and a PIN gate on the parent area
- [x] "Fun break" after every 5 problems in river stages (tap-the-fish, ~10 s, timer paused)
- [ ] Fun breaks for the other long node types if playtests show they drag
- [ ] More node types where math *is* the mechanic (market change-giving, grouping on the farm)

## Phase B — Skill graph + parent value

- [x] `Skill` model with NaCCA indicator codes, grade, prerequisites (content in `app/skills_content.py`, synced by `scripts/sync_skills.py`)
- [x] Fill in `naccaCode` from the official NaCCA 2019 curriculum where an indicator matches (8 of 12)
- [ ] Find NaCCA codes for the KG2 skills (KG numeracy is spread across themes) and decide what P2 multiplication maps to
- [ ] Curriculum fit: NaCCA starts multiplication in B3 (up to 5 × 5), but Kakum Forest (P2) teaches times tables and P3 goes to 12 × 12. Decide whether to move or cap them
- [x] Tag every question with a `skillId` (seeder tags new ones; `scripts/backfill_question_skills.py` tags old ones)
- [x] Run the skill backfill on the dev DB and on every Render build
- [ ] Make `Question.skillId` required once production has deployed with the backfill
- [x] Nodes point to skills; river and boss stages pick questions by `skillId` (falls back to topic+grade)
- [x] Boss battles record the child's first try at each question, so they count towards mastery
- [ ] Split the coarse skills (one per grade+topic today) into finer ones, e.g. add within 10 vs within 20
- [ ] Fix the P1 addition generator: it adds two numbers up to 20 (sums up to 40), but P1 is "within 20"
- [x] Mastery per student per skill, computed from `Answer` (`GET /api/skills/students/{id}`: not started / learning / practising / mastered, from the last 20 answers)
- [ ] Counting Catch and Number Pop make their own questions, so they don't count towards mastery yet
- [ ] Adaptive difficulty inside a node; spaced review of weak skills
- [ ] Free 10-minute diagnostic → places child on the map
- [ ] Shareable diagnostic report ("working at P1 level in subtraction")
- [x] Parent dashboard shows a skill map: mastered / practising / learning per skill, own-grade progress, "needs more practice"
- [ ] On-track / behind status on the skill map (needs the diagnostic, so skipped easier skills aren't counted as behind)
- [ ] Weekly WhatsApp / SMS report with a real-world activity tip
- [ ] Daily time limit set by parent
- [ ] Twi / Ga / Ewe audio for question narration (KG first)

## Phase C — Schools (distribution)

- [ ] `Teacher`, `Classroom`, `Enrollment` models; class join codes
- [ ] Teacher dashboard: who is behind on which skill
- [ ] Assign zones / skills to a class
- [ ] Link enrolled students to parents (invite via phone number)
- [ ] Pilot with 2–3 low-cost private schools

## Phase D — Monetisation

- [ ] Free: the full math path for every child
- [ ] Premium (sold to parents only, never upsold to kids): detailed reports, WhatsApp updates, offline packs, local-language audio, bonus worlds, multiple children, printables
- [ ] MoMo payments (MTN, Telecel, AirtelTigo): daily / weekly / per-term plans, sibling plan
- [ ] 7-day free trial
- [ ] School licence pricing

## Infrastructure (ongoing)

- [x] Installable PWA: manifest + icons, service worker saves every game page, "Add to home screen" card for parents
- [x] Offline play: map, river stages and boss battles work with no data (questions for unlocked stages are kept on the phone); results and events sync when back online
- [x] Answers given offline are kept on the phone and sent later, so they count towards mastery (`POST /api/game/practice/offline-sessions`)
- [x] Saved game pages refresh after a deploy (the app asks the service worker when it opens online, at most every 6 hours)
- [ ] Download a week of content ahead (more questions per skill, upcoming stages)
- [ ] Replace the placeholder flag icon once the Ghanaian art style is commissioned
- [x] Analytics events for retention metrics (queued offline on the device, deduplicated on the server)
- [x] Stop committing `frontend/.next/` build output to git
- [x] Fix SSR crash on `/practice`: `RiverGameCanvas` imports Phaser at module level (`window is not defined` → HTTP 500, then the client recovers)
- [x] Fix the ESLint config (`next/typescript` doesn't exist in Next 14.1) and the type error in `app/parent/dashboard/page.tsx`
- [x] Align the venv with `requirements.txt` (httpx 0.28 breaks the tests)
