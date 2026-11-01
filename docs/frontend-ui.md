# Frontend UI

## Routes

- `/login` — parent login
- `/register` — parent registration (2 steps)
- `/student/select` — choose child profile
- `/student/add` — create additional child profile
- `/dashboard` — main hub
- `/practice` — practice mode

## State Storage

- `localStorage.token` — JWT token
- `localStorage.user` — user profile
- `localStorage.parent` — parent profile
- `localStorage.students` — cached student list
- `localStorage.selectedStudent` — current student

## Practice Mode Flow

1. User picks a topic.
2. App requests questions from `/api/game/practice/start`.
3. App shows 10 questions with timer.
4. Each answer is submitted to `/api/game/practice/answer`.
5. Session ends with `/api/game/practice/complete`.

## UI Components

- `components/ui`: Button, Input, Card, Avatar, Icons (SVG star, Black Star coin, hearts, dock icons, Ghana flag, logo mark)
- `components/layout`: Header (slim brand bar + kente strip), AuthShell (login/register)
- `components/world`: ZoneScene (painted zone + winding road), WorldHud / Dock / GoalCard, ShopSheet, ModalSheet, RewardBurst, NodeResult, CoinBurst
- Global theme in `frontend/app/globals.css`, tokens in `frontend/tailwind.config.ts`

## Design system

Two moods, one brand: **kid screens** are bright scenes with chunky 3D buttons; **parent screens** are the same palette made quiet (white surfaces, ink text, space).

- **Colour roles**: `primary` indigo = brand; `secondary` gold = rewards (coins, stars, "play" nodes); `success` green = go / correct; `danger` coral = boss / wrong (never harsh); `ink` = text; `night` = dark surfaces (HUD, dock, profile lobby). Dark text on gold, never white (contrast).
- **Type**: Fredoka (`font-display`) for headings, buttons, numbers; Nunito (`font-body`) for copy. Both are self-hosted by `next/font`, so the offline service worker keeps them. `latin-ext` is included for Twi (ɛ, ɔ).
- **Buttons** (`.btn`, `.btn-primary|secondary|success|danger`) are 3D keys: a hard "ledge" shadow that the face presses into. Variants only set CSS variables. `Button variant="neutral"` is the white key (answer tiles, secondary actions).
- **Cards** have no heavy borders: white surface, hairline edge, soft ledge shadow (`shadow-card`).
- **Kente strip** (`.kente-strip`) is the one Ghana signature. Use it sparingly (header, brand panel).
- **Motion** is transform/opacity only, so cheap phones stay smooth, and every animation class is switched off under `prefers-reduced-motion`. An element that is centred with a `transform` must not also carry an animation that sets `transform`; wrap it (outer positions, inner animates).
- **Content art is still emoji** (avatars, zones, nodes, outfits) until the Ghanaian art style is commissioned. UI pieces a child sees constantly (stars, coins, hearts, lock, dock) are SVG so they look the same on every phone.
- **Map** (`ZoneScene`): each zone is a CSS/SVG landscape; the road is drawn in a fixed 360-wide space and scales with the screen. Add a zone by adding an entry to `SCENES`.
- **Goal card** picks one next thing from the child's real data: chest ready, an outfit they can afford, the outfit they're saving for, then the next stage. Don't add fake urgency (countdowns, streak guilt).

## Dev note

`next dev` keeps a stale copy of `tailwind.config.ts`. After changing tokens, touch `next.config.js`: Next restarts itself and picks up the new config.
