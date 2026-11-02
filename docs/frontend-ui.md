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
- `components/games`: GameScreen (GameTopBar, HudChip, GameIntro, GameDone) — the shared start and finish cards for Counting Catch, Number Pop and the Tug of War menus, so every game starts and ends the same way
- Global theme in `frontend/app/globals.css`, tokens in `frontend/tailwind.config.ts`

## Design system

Two moods, one brand: **kid screens** are flat blue-and-white scenes with big rounded buttons; **parent screens** are the same palette made quiet (white surfaces, ink text, space).

- **Palette is three colours: blue `#1D4ED8`, white, and yellow `#FFC21A`.** Every surface is flat blue or flat white: no gradients, no second shade of blue, no per-zone or per-animal colours. Yellow is the accent: rewards (coins, stars, "play" nodes), highlights, and text on blue. Tokens keep their old names so pages did not change: `primary` = blue; `secondary` = yellow; `success` = blue (go / correct); `danger` = yellow (try again / boss, always with an icon or words, never colour alone); `night` = blue (HUD, brand panel); `background` = white; `ink` = blue-navy text. `light`/`dark` variants are identical to `DEFAULT` on purpose. Navy ink on yellow, never white (contrast). Content art (animal avatars, emoji, the Ghana flag in the header, character art in Market Day and Tug of War) keeps its own colours.
- **Type**: Fredoka (`font-display`) for headings, buttons, numbers; Nunito (`font-body`) for copy. Both are self-hosted by `next/font`, so the offline service worker keeps them. `latin-ext` is included for Twi (ɛ, ɔ).
- **Buttons** (`.btn`, `.btn-primary|secondary|success|danger`) are flat solid keys that sink slightly when pressed. Variants only set CSS variables (`--btn-bg`, `--btn-ink`, `--btn-edge`). `Button variant="neutral"` is the white key with a blue edge (answer tiles, secondary actions).
- **Cards** have no heavy borders: white surface, hairline blue edge, soft shadow (`shadow-card`).
- **Signature strip** (`.kente-strip`) is now a row of yellow dashes. Use it sparingly (header, brand panel).
- **Motion** is transform/opacity only, so cheap phones stay smooth, and every animation class is switched off under `prefers-reduced-motion`. An element that is centred with a `transform` must not also carry an animation that sets `transform`; wrap it (outer positions, inner animates).
- **Content art is still emoji** (avatars, zones, nodes, outfits) until the Ghanaian art style is commissioned. UI pieces a child sees constantly (stars, coins, hearts, lock, dock) are SVG so they look the same on every phone.
- **Map** (`ZoneScene`): each zone is a flat blue sky with a white road and hills; the road is drawn in a fixed 360-wide space and scales with the screen. Cleared roads are yellow. All zones share one `FLAT` scene; zones are told apart by name and emoji. The old `/public/zones/*.webp` illustrations are no longer referenced by the map.
- **Goal card** picks one next thing from the child's real data: chest ready, an outfit they can afford, the outfit they're saving for, then the next stage. Don't add fake urgency (countdowns, streak guilt).

- **Tug of War** (`/battle`): menus and result use the white kid skin; the in-game screen is solid blue with white team panels. On a phone a boss battle stacks vertically (boss strip, rope, then the child's keypad, so the thumbs reach it); tablet and up, and two-player mode, keep the 3-column layout. Team 1 is blue (white shirts), team 2 / the boss is yellow.

## Dev note

`next dev` keeps a stale copy of `tailwind.config.ts`. After changing tokens, touch `next.config.js`: Next restarts itself and picks up the new config.
