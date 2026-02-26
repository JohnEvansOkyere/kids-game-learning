# Battle Mode: Tug of War (Phase 2)

## Overview

Two players on the **same device** play a tug-of-war battle. They see the **same question at the same time**. Whoever answers **correctly first** wins the round: their side gets a point and the rope pulls toward them. Next question is shown immediately. First side to reach the target score (e.g. 5) wins the game.

---

## Rules (summary)

| Rule | Description |
|------|-------------|
| Same question | Both players see one question and the same four answer options. |
| Answer anytime | Neither player waits for the other. Both can tap at the same time. |
| First correct wins the round | The first tap that is **correct** gives that side a point and pulls the rope; we then go to the next question. |
| Wrong answer | If a player taps a wrong option, show "Wrong!" for that player and **disable their buttons for that round**. The other player can still tap and get the point. |
| Next question | As soon as one player answers correctly, we move to the next question (no waiting for the other). |
| Rope | The more correct answers a side has, the more the rope is pulled toward that side. Rope position = score difference (e.g. 3–2 → rope slightly toward player with 3). |
| Win | First side to reach the target score (e.g. 5) wins the game. |

---

## Flow

1. **Setup**  
   - Choose **topic** (counting, addition, subtraction, multiplication).  
   - Optionally choose **target score** (e.g. 5 or 7).  
   - Grade from selected student (or default) for question difficulty.

2. **Battle screen**  
   - Top: **Player 1** (left) vs **Player 2** (right), with scores (e.g. `3 – 2`).  
   - Middle: **Rope** with a **knot**; knot position depends on score difference (e.g. 11 positions from full-left to full-right).  
   - Below: **One question** (e.g. “7 + 4 = ?”) in the center.  
   - Bottom: **Two sets of answer buttons** — left set for Player 1, right set for Player 2 (same four options on each side).

3. **Round**  
   - Question and four options are shown; both players can tap.  
   - **First correct tap** (by either player):  
     - That side gets +1 point.  
     - Rope animates toward that side.  
     - Optionally show “Player 1 wins the round!” or “Player 2 wins the round!” and who was faster (time from question show to correct tap).  
     - Load next question.  
   - **Wrong tap** (e.g. Player 1 taps wrong):  
     - Show “Wrong!” on Player 1’s side.  
     - Disable Player 1’s buttons for **this round only**.  
     - Player 2 can still tap; if correct, Player 2 wins the round and we go to next question.

4. **End of game**  
   - When one side reaches the target score (e.g. 5):  
     - Show winner: “Player 1 wins!” or “Player 2 wins!”  
     - Buttons: **Play again** (same topic/settings) and **Back to dashboard**.

---

## Who finished early (optional)

- For each round, record **time from question display to correct tap**.  
- After the round, optionally show: “Player 1 was faster!” or “Player 2 was faster!” (who had the smaller time).  
- Can be skipped in v1 and added later.

---

## UI layout (same device, 2 players)

```
┌─────────────────────────────────────────────────────────┐
│  ← Back                    BATTLE                        │
├─────────────────────────────────────────────────────────┤
│  Player 1 (left)           3  –  2           Player 2    │
├─────────────────────────────────────────────────────────┤
│  ◄══════════════════●════════════════════►               │
│              (rope + knot; knot moves with score)        │
├─────────────────────────────────────────────────────────┤
│              "7 + 4 = ?"  (one question, center)         │
├─────────────────────────────────────────────────────────┤
│  [ 9 ] [ 11 ] [ 12 ] [ 5 ]   (Player 1's buttons, left)  │
│  [ 9 ] [ 11 ] [ 12 ] [ 5 ]   (Player 2's same options)   │
└─────────────────────────────────────────────────────────┘
```

- One question in the middle.  
- Two rows (or left/right panels) of the **same four options** so each player has their own tap targets.  
- Rope: e.g. a horizontal bar with a knot; `knotPosition = 50% + (scoreP1 - scoreP2) * 10%` (or similar scale).

---

## State (frontend)

- `topic`, `targetScore`, `gradeLevel` (from setup).  
- `scoreP1`, `scoreP2` (e.g. 0..5).  
- `questions`: array of questions (from API, same as practice).  
- `currentIndex`: index of current question.  
- `currentQuestion`: current question object.  
- `roundOver`: true when someone just got it right (we are about to show next question).  
- `disabledP1`, `disabledP2`: disable that player’s buttons for the current round (e.g. after wrong tap).  
- `gameOver`, `winner`: 1 or 2 when target score is reached.

---

## Edge cases

| Case | Handling |
|------|----------|
| Both tap correct at the same time (same tick) | Treat as tie: no point, or give point to the one whose event was processed first (implementation-defined). Prefer: first event wins the round. |
| Both tap wrong | Both get “Wrong!” and are disabled for the round; show “No one got it! Correct was X.” and then load next question after a short delay. |
| No more questions | If we run out of questions before either reaches target, winner is the one with higher score; if tie, “It’s a tie!”. |

---

## Tech (implementation)

- **Route**: e.g. `/battle` (from Dashboard “Battle Mode”).  
- **API**: Reuse existing practice question API (e.g. get 10–15 questions for topic + grade).  
- **No backend change** for Phase 2: no new tables or endpoints; all state in React.  
- **Rope**: One component: rope bar + knot; knot position = `f(scoreP1 - scoreP2)` with CSS transition for smooth pull.  
- **Two answer panels**: Same four options rendered twice (left for P1, right for P2); each has its own `onClick`; on correct, update score, set `roundOver`, then `currentIndex++` and clear `disabledP1`/`disabledP2` for next round.

---

## Implementation order

1. Add `docs/battle-mode-tug-of-war.md` (this file).  
2. Create battle setup page: topic + target score; store in state and go to battle screen.  
3. Create battle screen: rope component, scores, one question, two answer panels.  
4. Implement round logic: first correct wins round, wrong disables that player for the round, next question.  
5. Implement game over: first to target score wins; Play again / Back to dashboard.  
6. Wire Dashboard “Battle Mode” to `/battle` (setup).  
7. Optional: “Who finished early” (time per round, show faster player).

---

## Changelog

- **Initial**: Phase 2 design — same question, both answer at same time, first correct wins round and pulls rope; wrong disables that player for the round; document process before coding.
- **Implemented**: Phase 2 — `/battle` setup (topic + target 3 or 5), rope component, two answer panels (Player 1 left, Player 2 right), first correct wins round and advances; wrong disables that player for the round; both wrong shows correct answer and advances; game over at target score; Play again / Dashboard. Dashboard "Battle Mode" links to `/battle`. Target options 3 and 5 (backend returns 10 questions; 7 would need more questions).
