

**Project Name:** MathChampions Ghana - Math Battle Game for Kids

**Target Users:** Ghanaian children (KG1-Primary 3, ages 3-9)

**Core Concept:** Competitive tug-of-war style math battles where kids answer questions to pull a rope and win trophies

**Tech Stack:**
- **Backend:** FastAPI + Python 3.11+
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Real-time:** WebSockets (FastAPI WebSockets)
- **Caching:** Redis
- **Deployment:** Docker-ready

**Design Principles:**
- ✅ Colorful, playful, child-friendly UI
- ✅ Big touch targets (minimum 60px)
- ✅ Voice narration for all questions
- ✅ Instant visual feedback
- ✅ Ghana-specific context (cedis, local items)
- ✅ Works on low-end Android devices
- ✅ Minimal data usage

---

## 📋 PHASE 1: Authentication & Basic UI Setup

### **Cursor Prompt - Phase 1:**

```
Build the authentication and basic UI foundation for a children's math learning game platform.

REQUIREMENTS:

1. BACKEND (FastAPI):
   - Create FastAPI project structure with:
     - /app folder with main.py
     - /routers for API endpoints
     - /models for database models
     - /schemas for Pydantic schemas
     - /services for business logic
   
   - Setup PostgreSQL with Prisma ORM
   
   - Create these database models:
     * User (id, email, password_hash, created_at)
     * Student (id, user_id, name, avatar, grade_level, date_of_birth)
     * Parent (id, user_id, name, phone_number)
   
   - Implement authentication endpoints:
     * POST /api/auth/register (parent registration)
     * POST /api/auth/login (returns JWT token)
     * POST /api/auth/logout
     * GET /api/auth/me (get current user)
   
   - Use bcrypt for password hashing
   - Use JWT tokens for authentication
   - Add CORS middleware for Next.js frontend

2. FRONTEND (Next.js):
   - Create Next.js 14 app with TypeScript
   - Setup Tailwind CSS with custom kid-friendly color palette:
     * Primary: Bright blue (#3B82F6)
     * Secondary: Sunny yellow (#FBBF24)
     * Success: Green (#10B981)
     * Danger: Red (#EF4444)
     * Background: Light cream (#FFF9E6)
   
   - Create these pages:
     * /login - Parent login page
     * /register - Parent registration page
     * /dashboard - Main dashboard (after login)
     * /student/select - Select which child to play as
   
   - Design requirements:
     * Use Comic Sans MS or similar playful font
     * All buttons minimum 60px height
     * Large, rounded corners (rounded-2xl)
     * Colorful gradients for buttons
     * Add fun illustrations (use free SVG illustrations)
   
   - Create components:
     * Button (primary, secondary, large variants)
     * Input (with big text, fun borders)
     * Card (colorful bordered cards)
     * Avatar (for student selection)
     * Layout (with colorful header/footer)

3. STUDENT PROFILE CREATION:
   - After parent registers, show "Add Your Child" flow:
     * Child's name (big input field)
     * Select avatar (6 fun character options: lion, elephant, cheetah, monkey, eagle, fish)
     * Select grade level (KG1, KG2, P1, P2, P3)
     * Date of birth (simple dropdown)
   
   - Parent can add multiple children (max 4 per account)
   
   - Student selection screen before playing:
     * Show all children as big colorful cards
     * Display avatar, name, level
     * Tap to select and enter

4. RESPONSIVE DESIGN:
   - Mobile-first approach
   - Works perfectly on 360px width (cheap Android phones)
   - Touch-friendly (no hover states needed)
   - Portrait orientation optimized

5. ERROR HANDLING:
   - Show friendly error messages for kids
   - "Oops! Something went wrong" instead of technical errors
   - Loading states with fun spinners/animations

ACCEPTANCE CRITERIA:
- Parent can register with email/password
- Parent can login and see dashboard
- Parent can add 1-4 children profiles
- Each child has avatar, name, grade level
- Student selection screen works on mobile
- All forms have validation
- JWT authentication works across frontend/backend
- Database migrations run successfully

GHANA-SPECIFIC:
- Add Ghana flag 🇬🇭 in header
- Support Ghana phone format (+233)
- All currency shown as GH₵

FILE STRUCTURE:
backend/
├── app/
│   ├── main.py
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   └── services/
├── prisma/
│   └── schema.prisma
└── requirements.txt

frontend/
├── app/
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   └── student/
├── components/
└── lib/

Start with backend setup first, then frontend. Make it colorful and fun!
```

---

## 📋 PHASE 2: Question Bank & Practice Mode

### ** Prompt - Phase 2:**

```
Build the math question bank system and single-player practice mode.

REQUIREMENTS:

1. DATABASE MODELS (Add to Prisma schema):
   
   model Question {
     id            String   @id @default(uuid())
     topic         String   // "counting", "addition", "subtraction", "multiplication"
     gradeLevel    String   // "KG1", "KG2", "P1", "P2", "P3"
     difficulty    Int      // 1-5
     questionText  String
     questionImage String?  // Optional URL to image
     audioFile     String?  // Optional URL to audio
     correctAnswer Int
     options       Json     // [5, 6, 7, 8, 9]
     explanation   String?
     localContext  Boolean  @default(false) // Ghana-specific?
     createdAt     DateTime @default(now())
   }
   
   model GameSession {
     id              String   @id @default(uuid())
     studentId       String
     student         Student  @relation(fields: [studentId], references: [id])
     mode            String   // "practice", "battle"
     topic           String
     questionsAsked  Int      @default(0)
     correctAnswers  Int      @default(0)
     wrongAnswers    Int      @default(0)
     totalTime       Int      @default(0) // seconds
     score           Int      @default(0)
     status          String   // "active", "completed"
     startedAt       DateTime @default(now())
     completedAt     DateTime?
   }
   
   model Answer {
     id              String      @id @default(uuid())
     sessionId       String
     session         GameSession @relation(fields: [sessionId], references: [id])
     questionId      String
     question        Question    @relation(fields: [questionId], references: [id])
     selectedAnswer  Int
     isCorrect       Boolean
     timeSpent       Int         // seconds
     answeredAt      DateTime    @default(now())
   }

2. SEED QUESTIONS (Create seed script):
   
   Create 100+ questions covering:
   
   KG1 Level:
   - Counting 1-10 (20 questions)
   - Number recognition (20 questions)
   - Basic shapes (10 questions)
   
   KG2 Level:
   - Counting 1-20 (20 questions)
   - Simple addition 1-5 (20 questions)
   - Simple subtraction 1-5 (20 questions)
   
   Primary 1:
   - Addition 1-20 (30 questions)
   - Subtraction 1-20 (30 questions)
   
   Primary 2:
   - Addition 1-100 (25 questions)
   - Subtraction 1-100 (25 questions)
   - Multiplication 2x, 5x, 10x tables (30 questions)
   
   Primary 3:
   - All operations with larger numbers (40 questions)
   
   Ghana-specific examples:
   - "Kofi has 5 toffees, Ama gives him 3 more. How many now?"
   - "A trotro has 3 rows, each row has 4 seats. How many seats?"
   - "Mangoes cost GH₵2 each. 5 mangoes cost how much?"

3. BACKEND ENDPOINTS:
   
   Questions:
   - GET /api/questions/random
     * Query params: topic, gradeLevel, difficulty, count
     * Returns array of questions (without correct answers)
   
   - POST /api/questions/seed (admin only)
     * Seeds database with initial questions
   
   Game Sessions:
   - POST /api/game/practice/start
     * Body: { studentId, topic, gradeLevel }
     * Creates new practice session
     * Returns sessionId and first 10 questions
   
   - POST /api/game/practice/answer
     * Body: { sessionId, questionId, answer, timeSpent }
     * Validates answer
     * Updates session stats
     * Returns { correct: boolean, correctAnswer: number, explanation: string }
   
   - POST /api/game/practice/complete
     * Body: { sessionId }
     * Marks session complete
     * Returns final stats and rewards
   
   - GET /api/game/sessions/:studentId
     * Returns student's game history

4. FRONTEND - PRACTICE MODE:
   
   Create /app/practice page:
   
   STEP 1: Topic Selection Screen
   - Big colorful cards for each topic:
     * 🔢 Counting (KG1-KG2)
     * ➕ Addition (KG2-P3)
     * ➖ Subtraction (KG2-P3)
     * ✖️ Multiplication (P2-P3)
   - Each card shows:
     * Icon + topic name
     * Student's mastery level (⭐⭐⭐)
     * "Start Practice" button
   
   STEP 2: Game Screen
   Layout:
   ┌─────────────────────────────────┐
   │  [Back] Question 3/10    ⏱️ 45s │
   │                                 │
   │  ⭐⭐⭐ Kofi's Practice ⭐⭐⭐    │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │                          │  │
   │  │    5 + 3 = ?            │  │
   │  │                          │  │
   │  │  [Optional: Image here]  │  │
   │  │                          │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
   │  │ 6  │ │ 7  │ │ 8  │ │ 9  │  │
   │  └────┘ └────┘ └────┘ └────┘  │
   │                                 │
   │  Correct: 2 ✓   Wrong: 0 ✗    │
   └─────────────────────────────────┘
   
   Features:
   - Timer per question (30 seconds)
   - Big tappable answer buttons (4 options)
   - Instant feedback:
     * Correct: Button turns green, confetti animation, "Ayekoo!" sound
     * Wrong: Button shakes, turns red, show correct answer
   - Progress bar at top
   - Auto-advance to next question after 2 seconds
   
   STEP 3: Results Screen
   ┌─────────────────────────────────┐
   │      🎉 Great Job Kofi! 🎉     │
   │                                 │
   │         ⭐ 70% Score ⭐         │
   │                                 │
   │  ✓ Correct: 7/10               │
   │  ✗ Wrong: 3/10                 │
   │  ⏱️ Avg Time: 8.5s              │
   │                                 │
   │  🏆 Rewards Earned:             │
   │    +35 Stars ⭐                │
   │    +1 Bronze Trophy 🥉          │
   │                                 │
   │  ┌──────────┐  ┌──────────┐   │
   │  │Play Again│  │  Dashboard│   │
   │  └──────────┘  └──────────┘   │
   └─────────────────────────────────┘

5. SOUND & ANIMATIONS:
   - Add sound effects:
     * Correct answer: "ding" sound
     * Wrong answer: "buzzer" sound
     * Completion: "celebration" music
   - Add confetti animation on correct answers (use canvas-confetti library)
   - Smooth transitions between questions
   - Loading animations while fetching questions

6. OFFLINE SUPPORT (Basic):
   - Cache last 50 questions in localStorage
   - Show "Playing Offline" indicator
   - Sync results when back online

7. ACCESSIBILITY:
   - Large text (minimum 18px)
   - High contrast colors
   - Voice narration placeholder (add later)
   - Screen reader friendly

ACCEPTANCE CRITERIA:
- Student can select practice topic
- 10 random questions load based on grade level
- Timer counts down per question
- Correct/wrong feedback shows immediately
- Results screen shows stats
- Session saves to database
- Student can replay same topic
- Works smoothly on mobile (no lag)

GHANA-SPECIFIC QUESTIONS:
- Use local names: Kofi, Ama, Kwame, Abena
- Use local items: toffees, kenkey, trotro, mangoes
- Use GH₵ for money questions

TESTING:
- Create test user with KG1 student
- Complete full practice session
- Verify database records created
- Test on mobile Chrome (360px width)

Start with database models, then seed script, then backend, then frontend!
```

---

## 📋 PHASE 3: Real-Time Battle Mode

### **Cursor Prompt - Phase 3:**

```
Build the real-time multiplayer tug-of-war math battle system.

REQUIREMENTS:

1. DATABASE MODELS (Add to Prisma):
   
   model BattleSession {
     id              String   @id @default(uuid())
     sessionCode     String   @unique // 6-digit code for joining
     playerAId       String
     playerA         Student  @relation("PlayerA", fields: [playerAId], references: [id])
     playerBId       String?
     playerB         Student? @relation("PlayerB", fields: [playerBId], references: [id])
     topic           String
     gradeLevel      String
     currentRound    Int      @default(0)
     totalRounds     Int      @default(10)
     ropePosition    Int      @default(0) // -5 to +5 (0 is center)
     playerAScore    Int      @default(0)
     playerBScore    Int      @default(0)
     status          String   // "waiting", "active", "finished"
     winnerId        String?
   currentQuestion Json?    // Current question being asked
     createdAt       DateTime @default(now())
     startedAt       DateTime?
     completedAt     DateTime?
   }
   
   model BattleAnswer {
     id            String        @id @default(uuid())
     battleId      String
     battle        BattleSession @relation(fields: [battleId], references: [id])
     roundNumber   Int
     studentId     String
     student       Student       @relation(fields: [studentId], references: [id])
     questionId    String
     answer        Int
     isCorrect     Boolean
     timeSpent     Float         // milliseconds
     answeredAt    DateTime      @default(now())
   }
   
   model Trophy {
     id          String   @id @default(uuid())
     studentId   String
     student     Student  @relation(fields: [studentId], references: [id])
     type        String   // "bronze", "silver", "gold", "diamond", "champion"
     topic       String
     earnedAt    DateTime @default(now())
   }

2. WEBSOCKET SERVER (FastAPI):
   
   Create /app/websocket.py:
   
   Connection Manager:
   - Handle WebSocket connections
   - Maintain active battles dictionary
   - Broadcast to both players in a battle
   
   WebSocket Events:
   
   CLIENT → SERVER:
   - "create_battle" { studentId, topic, gradeLevel }
     → Creates battle, returns sessionCode
   
   - "join_battle" { studentId, sessionCode }
     → Player B joins, battle starts
   
   - "submit_answer" { battleId, answer, timeSpent }
     → Process answer, update rope position
   
   - "request_next_round"
     → Load next question
   
   SERVER → CLIENT:
   - "battle_created" { battleId, sessionCode }
   - "player_joined" { playerB: {...} }
   - "battle_started" { question, round }
   - "answer_result" { playerId, correct, ropePosition, scores }
   - "round_complete" { winner, ropePosition, nextQuestion }
   - "battle_finished" { winnerId, finalScores, trophies }
   
   Game Logic:
   - Both players get SAME question simultaneously
   - First correct answer pulls rope toward them
   - If both correct, faster player wins the pull
   - If one wrong, other gets the pull (even if they didn't answer yet)
   - Rope moves 1 position per round (-5 to +5)
   - Win condition: rope at +5 or -5, OR most points after 10 rounds

3. BACKEND ENDPOINTS:
   
   - POST /api/battle/create
     * Body: { studentId, topic, gradeLevel, mode: "friend" }
     * Returns: { battleId, sessionCode }
   
   - POST /api/battle/join
     * Body: { studentId, sessionCode }
     * Returns: { battle, playerA, playerB }
   
   - GET /api/battle/:battleId
     * Returns current battle state
   
   - POST /api/battle/:battleId/complete
     * Award trophies, update stats
     * Returns final results

4. FRONTEND - BATTLE MODE:
   
   Create /app/battle page:
   
   SCREEN 1: Battle Menu
   ┌─────────────────────────────────┐
   │    ⚔️ Math Battle Arena ⚔️      │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  👥 Challenge Friend     │  │
   │  │                          │  │
   │  │  Play with a classmate!  │  │
   │  │  [Start Challenge]       │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  🎲 Random Opponent      │  │
   │  │  (Coming Soon!)          │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  💪 Practice vs AI       │  │
   │  │  (Uses Practice Mode)    │  │
   │  └──────────────────────────┘  │
   └─────────────────────────────────┘
   
   SCREEN 2: Create/Join Battle
   
   If Creating:
   ┌─────────────────────────────────┐
   │  Select Topic for Battle:       │
   │                                 │
   │  [ ➕ Addition ]                │
   │  [ ➖ Subtraction ]             │
   │  [ ✖️ Multiplication ]          │
   │                                 │
   │  [Create Battle]                │
   └─────────────────────────────────┘
   
   After Creating:
   ┌─────────────────────────────────┐
   │   Waiting for Friend...         │
   │                                 │
   │   Share this code:              │
   │   ┌──────────┐                 │
   │   │  A B 5 2 │                 │
   │   │  9 7     │                 │
   │   └──────────┘                 │
   │                                 │
   │   [Copy Code] [Share]           │
   │                                 │
   │   ⏳ Waiting for friend to join │
   │                                 │
   │   [Cancel Battle]               │
   └─────────────────────────────────┘
   
   If Joining:
   ┌─────────────────────────────────┐
   │   Enter Battle Code:            │
   │                                 │
   │   ┌─┬─┬─┬─┬─┬─┐               │
   │   │A│B│5│2│9│7│               │
   │   └─┴─┴─┴─┴─┴─┘               │
   │                                 │
   │   [Join Battle]                 │
   └─────────────────────────────────┘
   
   SCREEN 3: Battle Arena (MAIN GAME)
   ┌─────────────────────────────────┐
   │ Kofi 🦁        Round 3/10   Ama 🐘│
   │  ⭐3                        ⭐2  │
   │                                 │
   │  💪 ←─①─②─③─④─⑤─🎯─⑥─⑦─⑧─⑨─⑩→ 💪 │
   │                  ↑              │
   │          (Rope position)        │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │                          │  │
   │  │      12 + 7 = ?          │  │
   │  │                          │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
   │  │ 17 │ │ 18 │ │ 19 │ │ 20 │  │
   │  └────┘ └────┘ └────┘ └────┘  │
   │                                 │
   │  ⏱️ 10s                          │
   │                                 │
   │  [Kofi answered!] ✓             │
   │  [Waiting for Ama...]           │
   └─────────────────────────────────┘
   
   Real-time Updates:
   - Show when opponent answers
   - Animate rope pulling
   - Show "You won this round!" / "Opponent won!"
   - Confetti for round winner
   - Sound effects for pulls
   
   SCREEN 4: Victory/Defeat
   
   WINNER:
   ┌─────────────────────────────────┐
   │      🎉 KOFI WINS! 🎉          │
   │                                 │
   │          🏆                     │
   │      GOLD TROPHY                │
   │                                 │
   │   Final Score: 6 - 4           │
   │                                 │
   │   Your Stats:                   │
   │   ✓ 8 Correct                  │
   │   ⚡ Avg Time: 4.2s             │
   │   🔥 Best Streak: 4             │
   │                                 │
   │   Rewards:                      │
   │   ⭐ +100 Stars                 │
   │   🏅 Winner Badge               │
   │                                 │
   │   [Rematch] [Dashboard]         │
   └─────────────────────────────────┘
   
   LOSER (Still encouraging!):
   ┌─────────────────────────────────┐
   │      Good Try, Ama! 💪          │
   │                                 │
   │          🥈                     │
   │      You fought well!           │
   │                                 │
   │   Final Score: 4 - 6           │
   │                                 │
   │   Your Stats:                   │
   │   ✓ 6 Correct                  │
   │   ⚡ Avg Time: 5.1s             │
   │   🔥 Best Streak: 3             │
   │                                 │
   │   Rewards:                      │
   │   ⭐ +50 Stars                  │
   │   💪 Effort Badge               │
   │                                 │
   │   [Rematch] [Practice More]     │
   └─────────────────────────────────┘

5. ANIMATIONS (Framer Motion):
   - Rope pulling animation (smooth translate)
   - Character celebrations (bounce/shake)
   - Confetti on round wins
   - Score counter animations
   - Smooth transitions between rounds

6. SOUND EFFECTS:
   - Rope pull sound
   - Victory fanfare
   - Defeat sound (gentle, not harsh)
   - Countdown beep
   - Answer submit "whoosh"

7. ERROR HANDLING:
   - Connection lost → "Reconnecting..."
   - Opponent disconnects → "Opponent left, you win!"
   - Invalid code → "Battle code not found"
   - Battle full → "This battle already has 2 players"

8. TROPHY SYSTEM:
   Backend logic:
   - 1st win → Bronze Trophy
   - 5 wins → Silver Trophy
   - 10 wins → Gold Trophy
   - 25 wins → Diamond Trophy
   - 50 wins → Champion Trophy
   
   Frontend:
   - Show trophy unlock animation
   - Trophy display on student profile
   - Trophy cabinet page

ACCEPTANCE CRITERIA:
- Player A creates battle, gets code
- Player B joins with code
- Both see same question simultaneously
- First correct answer pulls rope
- Rope animates smoothly
- Winner determined correctly
- Trophies awarded
- Rematch works
- WebSocket handles disconnections gracefully
- Works on mobile without lag

TESTING:
- Test with 2 browser windows side-by-side
- Verify rope position updates correctly
- Test disconnect/reconnect scenarios
- Test on 3G network speed
- Verify trophy awards

GHANA-SPECIFIC:
- Celebration sounds appropriate for kids
- Trophy names culturally relevant
- Victory messages encouraging in tone

Start with WebSocket backend, then frontend battle screens!
```

---

## 📋 PHASE 4: Rewards & Progression System

### **Cursor Prompt - Phase 4:**

```
Build the rewards, achievements, and progression system to keep kids engaged long-term.

REQUIREMENTS:

1. DATABASE MODELS (Add to Prisma):
   
   model Student {
     // Add to existing Student model:
     totalStars      Int       @default(0)
     level           Int       @default(1)
     experience      Int       @default(0)
     currentAvatar   String    @default("lion")
     unlockedAvatars Json      @default(["lion"]) // Array of unlocked avatars
     trophyCount     Int       @default(0)
     streakDays      Int       @default(0)
     lastPlayedAt    DateTime?
   }
   
   model Achievement {
     id          String   @id @default(uuid())
     studentId   String
     student     Student  @relation(fields: [studentId], references: [id])
     type        String   // "speed_demon", "perfect_round", "hot_streak", etc.
     name        String
     description String
     icon        String
     earnedAt    DateTime @default(now())
   }
   
   model DailyStreak {
     id        String   @id @default(uuid())
     studentId String
     student   Student  @relation(fields: [studentId], references: [id])
     date      DateTime @db.Date
     completed Boolean  @default(false)
     
     @@unique([studentId, date])
   }
   
   model Leaderboard {
     id         String   @id @default(uuid())
     studentId  String   @unique
     student    Student  @relation(fields: [studentId], references: [id])
     gradeLevel String
     totalWins  Int      @default(0)
     totalStars Int      @default(0)
     winRate    Float    @default(0.0)
     rank       Int?
     updatedAt  DateTime @updatedAt
   }

2. STAR & EXPERIENCE SYSTEM:
   
   Stars Earned:
   - Practice mode correct answer: +5 stars
   - Battle win: +100 stars
   - Battle loss: +50 stars (participation)
   - Perfect practice (10/10): +50 bonus
   - Fast answer (<5s): +10 bonus
   - Daily login: +20 stars
   - 7-day streak: +100 stars
   
   Experience (XP):
   - Same as stars but separate
   - Level up every 500 XP
   - Max level: 50
   
   Level Unlocks:
   - Level 1: Lion avatar (default)
   - Level 5: Elephant avatar
   - Level 10: Cheetah avatar + Bronze border
   - Level 15: Monkey avatar + Beach arena
   - Level 20: Eagle avatar + Silver border
   - Level 25: Fish avatar + Stadium arena
   - Level 30: Gold border
   - Level 50: Champion crown avatar

3. ACHIEVEMENT SYSTEM:
   
   Create achievement checker service:
   
   Achievements to implement:
   
   ⚡ Speed Demon
   - Trigger: Answer 5 questions in under 3 seconds each
   - Reward: +200 stars, Speed badge
   
   🎯 Perfect Round
   - Trigger: Win battle 10-0
   - Reward: +300 stars, Perfect badge
   
   🔥 Hot Streak
   - Trigger: 10 correct answers in a row
   - Reward: +150 stars, Streak badge
   
   🧠 Math Genius
   - Trigger: 95% accuracy over 20 battles
   - Reward: +500 stars, Genius badge
   
   💪 Comeback Kid
   - Trigger: Win after being down 0-5
   - Reward: +250 stars, Comeback badge
   
   📚 Dedicated Learner
   - Trigger: Play 7 days in a row
   - Reward: +300 stars, Dedication badge
   
   🏆 Trophy Collector
   - Trigger: Earn 10 trophies
   - Reward: +400 stars, Collector badge
   
   👑 Champion
   - Trigger: Win 50 battles
   - Reward: +1000 stars, Champion badge
   
   🌟 Star Collector
   - Trigger: Earn 1000 total stars
   - Reward: Special star avatar

4. DAILY STREAK:
   
   Backend logic:
   - Track when student plays each day
   - If plays today but not yesterday → streak resets to 1
   - If plays today and yesterday → streak++
   - Award bonus stars for streaks:
     * 3 days: +50 stars
     * 7 days: +100 stars
     * 14 days: +200 stars
     * 30 days: +500 stars

5. LEADERBOARDS:
   
   Types:
   - Global (all students)
   - By grade level (KG1, KG2, P1, P2, P3)
   - Friends only (students from same parent account)
   - Weekly (resets every Monday)
   - All-time
   
   Ranking based on:
   - Total battle wins (primary)
   - Win rate (secondary)
   - Total stars (tertiary)
   
   Update leaderboard after each battle

6. BACKEND ENDPOINTS:
   
   - GET /api/student/:id/stats
     * Returns: level, xp, stars, trophies, achievements, streak
   
   - GET /api/student/:id/progress
     * Returns: XP to next level, unlocked avatars, next unlocks
   
   - POST /api/student/:id/daily-checkin
     * Records daily play
     * Updates streak
     * Awards daily bonus
   
   - GET /api/achievements/:studentId
     * Returns all achievements (locked + unlocked)
   
   - GET /api/leaderboard
     * Query params: type, gradeLevel, timeframe
     * Returns ranked list
   
   - POST /api/student/:id/avatar
     * Body: { avatarId }
     * Changes current avatar (must be unlocked)

7. FRONTEND PAGES:
   
   PROFILE PAGE (/app/profile/[studentId]):
   ┌─────────────────────────────────┐
   │  [Back]    Kofi's Profile       │
   │                                 │
   │       🦁 Level 12 🦁            │
   │                                 │
   │  XP: [████████░░] 650/1000     │
   │                                 │
   │  ⭐ 1,245 Stars                 │
   │  🏆 8 Trophies                  │
   │  🔥 5 Day Streak                │
   │  ⚔️ 15 Battles Won               │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  Achievements (6/15)     │  │
   │  │  [⚡][🎯][🔥][  ][  ]   │  │
   │  │  [View All]              │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  Trophy Cabinet          │  │
   │  │  🥉×3  🥈×2  🥇×3        │  │
   │  │  [View All]              │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  [Change Avatar] [Leaderboard]  │
   └─────────────────────────────────┘
   
   AVATAR SELECTION:
   ┌─────────────────────────────────┐
   │       Choose Your Avatar        │
   │                                 │
   │  ┌────┐ ┌────┐ ┌────┐          │
   │  │ 🦁 │ │ 🐘 │ │ 🐆 │          │
   │  │ ✓  │ │ ✓  │ │ ✓  │          │
   │  │Lion│ │Ele │ │Chee│          │
   │  └────┘ └────┘ └────┘          │
   │                                 │
   │  ┌────┐ ┌────┐ ┌────┐          │
   │  │ 🐵 │ │ 🦅 │ │ 🐠 │          │
   │  │ 🔒 │ │ 🔒 │ │ 🔒 │          │
   │  │Monk│ │Eagl│ │Fish│          │
   │  │Lv15│ │Lv20│ │Lv25│          │
   │  └────┘ └────┘ └────┘          │
   │                                 │
   │         [Select]                │
   └─────────────────────────────────┘
   
   ACHIEVEMENTS PAGE:
   ┌─────────────────────────────────┐
   │      🏅 Achievements 🏅         │
   │                                 │
   │  Unlocked (6):                  │
   │                                 │
   │  ⚡ Speed Demon                 │
   │  Answer 5 questions under 3s    │
   │  ✓ Earned Jan 15, 2026         │
   │                                 │
   │  🎯 Perfect Round               │
   │  Win a battle 10-0              │
   │  ✓ Earned Jan 18, 2026         │
   │                                 │
   │  🔥 Hot Streak                  │
   │  10 correct in a row            │
   │  ✓ Earned Jan 20, 2026         │
   │                                 │
   │  Locked (9):                    │
   │                                 │
   │  🧠 Math Genius 🔒              │
   │  95% accuracy over 20 battles   │
   │  Progress: 85% (17/20)          │
   │                                 │
   │  💪 Comeback Kid 🔒             │
   │  Win after being down 0-5       │
   │  Not yet attempted              │
   └─────────────────────────────────┘
   
   LEADERBOARD PAGE:
   ┌─────────────────────────────────┐
   │        🏆 Leaderboard 🏆        │
   │                                 │
   │  [Global] [Grade] [Friends]     │
   │  [Weekly] [All-Time]            │
   │                                 │
   │  Primary 2 - All Time:          │
   │                                 │
   │  🥇 1. Ama 🐘                   │
   │     1,856 ⭐ | 42 wins          │
   │                                 │
   │  🥈 2. Kwame 🦁                 │
   │     1,654 ⭐ | 38 wins          │
   │                                 │
   │  🥉 3. Abena 🐆                 │
   │     1,502 ⭐ | 35 wins          │
   │                                 │
   │  4. Kofi 🦅                     │
   │     1,245 ⭐ | 28 wins ← YOU    │
   │                                 │
   │  5. Yaw 🐵                      │
   │     1,103 ⭐ | 25 wins          │
   │                                 │
   │  [Load More]                    │
   └─────────────────────────────────┘

8. REWARD NOTIFICATIONS:
   
   Create toast/modal system for rewards:
   
   - Level up notification (full-screen celebration)
   - Achievement unlocked (modal with animation)
   - New avatar unlocked (celebratory popup)
   - Daily streak bonus (toast notification)
   - Trophy earned (animated trophy reveal)
   
   Use Framer Motion for animations

9. GAMIFICATION HOOKS:
   
   Add to dashboard:
   - "Today's Goal: Win 3 battles (1/3 ✓)"
   - "You're 50 stars away from unlocking Cheetah!"
   - "2 more wins to reach Bronze trophy!"
   - "Play tomorrow to keep your 5-day streak!"

10. ANALYTICS (Backend):
    
    Track engagement metrics:
    - Daily Active Users (DAU)
    - Average session time
    - Retention rate (7-day, 30-day)
    - Most played topics
    - Average battles per student
    - Level distribution

ACCEPTANCE CRITERIA:
- Stars awarded correctly after each game
- Level up triggers when XP threshold reached
- Achievements detected and awarded automatically
- Daily streak tracks correctly
- Leaderboard updates after battles
- Avatar unlocks at correct levels
- Profile page shows all stats accurately
- Notifications appear for all rewards
- Gamification hooks motivate continued play

TESTING:
- Complete 10 practice rounds, verify stars
- Win 5 battles, check trophy awards
- Play 3 consecutive days, verify streak
- Trigger achievement conditions, verify unlock
- Check leaderboard ranking accuracy
- Test level progression from 1 to 5

GHANA-SPECIFIC:
- Achievement names kid-friendly
- Celebration messages culturally appropriate
- Leaderboard encourages friendly competition
- Rewards exciting for Ghanaian kids

Start with database models, then backend logic, then frontend UI!
```

---

## 📋 PHASE 5: Parent/Teacher Dashboard

### **Cursor Prompt - Phase 5:**

```
Build comprehensive dashboards for parents and teachers to monitor student progress.

REQUIREMENTS:

1. DATABASE MODELS (Add to Prisma):
   
   model Parent {
     // Add to existing Parent model:
     subscriptionType  String   @default("free") // "free", "premium"
     subscriptionEnds  DateTime?
     maxChildren       Int      @default(1)
   }
   
   model Teacher {
     id            String   @id @default(uuid())
     userId        String   @unique
     user          User     @relation(fields: [userId], references: [id])
     name          String
     email         String   @unique
     school        String
     phoneNumber   String
     verifiedAt    DateTime?
     classes       Class[]
     createdAt     DateTime @default(now())
   }
   
   model Class {
     id          String    @id @default(uuid())
     teacherId   String
     teacher     Teacher   @relation(fields: [teacherId], references: [id])
     name        String    // "Primary 2A"
     gradeLevel  String
     students    Student[]
     school      String
     isActive    Boolean   @default(true)
     createdAt   DateTime  @default(now())
   }
   
   model ProgressReport {
     id              String   @id @default(uuid())
     studentId       String
     student         Student  @relation(fields: [studentId], references: [id])
     startDate       DateTime
     endDate         DateTime
     totalSessions   Int
     totalQuestions  Int
     correctAnswers  Int
     accuracy        Float
     averageTime     Float
     topicsImproving Json
     topicsStruggling Json
     generatedAt     DateTime @default(now())
   }

2. PARENT DASHBOARD (/app/parent/dashboard):
   
   OVERVIEW SCREEN:
   ┌─────────────────────────────────┐
   │  Welcome back, Mrs. Mensah! 👋  │
   │                                 │
   │  Your Children:                 │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  🦁 Kofi (P2)            │  │
   │  │  Last played: Today      │  │
   │  │  ⭐ 1,245 stars          │  │
   │  │  📊 View Progress        │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  🐘 Ama (KG2)            │  │
   │  │  Last played: Yesterday  │  │
   │  │  ⭐ 456 stars            │  │
   │  │  📊 View Progress        │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  [+ Add Another Child]          │
   │                                 │
   │  Quick Actions:                 │
   │  • Set screen time limits       │
   │  • View weekly report           │
   │  • Upgrade to Premium           │
   │                                 │
   │  [Settings] [Support]           │
   └─────────────────────────────────┘
   
   CHILD PROGRESS PAGE:
   ┌─────────────────────────────────┐
   │  [Back]  Kofi's Progress        │
   │                                 │
   │  This Week (Feb 5-11):          │
   │                                 │
   │  ⏱️ Play Time: 2h 15min         │
   │  📚 Sessions: 12                │
   │  ⚔️ Battles: 8 (6 wins)         │
   │  ✓ Accuracy: 78%                │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │ Performance by Topic     │  │
   │  │                          │  │
   │  │ Addition:      ⭐⭐⭐⭐   │  │
   │  │ 92% accuracy             │  │
   │  │                          │  │
   │  │ Subtraction:   ⭐⭐⭐     │  │
   │  │ 75% accuracy             │  │
   │  │                          │  │
   │  │ Multiplication: ⭐⭐      │  │
   │  │ 58% accuracy ⚠️          │  │
   │  │ (Needs practice)         │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │ Daily Activity           │  │
   │  │ [Bar Chart]              │  │
   │  │ Mon Tue Wed Thu Fri      │  │
   │  │  ██  ███  █   ███  ██   │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  Recent Achievements:            │
   │  🔥 5-Day Streak (Yesterday)    │
   │  ⚡ Speed Demon (Feb 8)         │
   │                                 │
   │  [Download Report PDF]          │
   └─────────────────────────────────┘
   
   INSIGHTS & RECOMMENDATIONS:
   ┌─────────────────────────────────┐
   │  📊 AI-Powered Insights         │
   │                                 │
   │  ✅ Strengths:                  │
   │  • Excellent at addition        │
   │  • Fast response times          │
   │  • Consistent daily practice    │
   │                                 │
   │  ⚠️ Areas for Improvement:      │
   │  • Multiplication tables        │
   │    Suggestion: Practice 5x      │
   │    table for 10 min daily       │
   │                                 │
   │  • Word problems                │
   │    Suggestion: Enable voice     │
   │    narration to help reading    │
   │                                 │
   │  📈 Progress Trend:             │
   │  Kofi is improving steadily!    │
   │  Accuracy up 12% this month.    │
   │                                 │
   │  🎯 Recommended Goals:          │
   │  • Master 5x table this week    │
   │  • Win 5 more battles          │
   │  • Reach level 13               │
   └─────────────────────────────────┘

3. TEACHER DASHBOARD (/app/teacher/dashboard):
   
   Required Features:
   
   CLASS MANAGEMENT:
   ┌─────────────────────────────────┐
   │  Teacher: Mr. Osei              │
   │  School: Morning Star Academy   │
   │                                 │
   │  My Classes:                    │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  Primary 2A (28 students)│  │
   │  │  Last active: Today      │  │
   │  │  Avg accuracy: 76%       │  │
   │  │  [View Class]            │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  ┌──────────────────────────┐  │
   │  │  Primary 2B (25 students)│  │
   │  │  Last active: Yesterday  │  │
   │  │  Avg accuracy: 82%       │  │
   │  │  [View Class]            │  │
   │  └──────────────────────────┘  │
   │                                 │
   │  [+ Create New Class]           │
   │                                 │
   │  Quick Actions:                 │
   │  • Start class tournament       │
   │  • Assign homework              │
   │  • Generate reports             │
   └─────────────────────────────────┘
   
   CLASS DETAILS:
   ┌─────────────────────────────────┐
   │  Primary 2A Performance         │
   │                                 │
   │  Overall Stats (This Week):     │
   │  📚 Total Sessions: 156         │
   │  ✓ Avg Accuracy: 76%            │
   │  ⏱️ Avg Time: 12.3s/question    │
   │  🏆 Total Trophies: 42          │
   │                                 │
   │  Top Performers:                │
   │  🥇 Ama - 94% accuracy          │
   │  🥈 Kwame - 89% accuracy        │
   │  🥉 Abena - 86% accuracy        │
   │                                 │
   │  Students Needing Help:         │
   │  ⚠️ Kofi - 58% (Multiplication) │
   │  ⚠️ Yaw - 62% (Word problems)   │
   │                                 │
   │  Topic Performance:             │
   │  Addition:        ████████ 85%  │
   │  Subtraction:     ███████░ 78%  │
   │  Multiplication:  ████░░░░ 64%  │
   │                                 │
   │  [Start Tournament]             │
   │  [Assign Practice]              │
   │  [Download Report]              │
   └─────────────────────────────────┘
   
   TOURNAMENT SETUP:
   ┌─────────────────────────────────┐
   │  Create Class Tournament        │
   │                                 │
   │  Tournament Name:               │
   │  [Multiplication Champions]     │
   │                                 │
   │  Topic:                         │
   │  [Multiplication ▼]             │
   │                                 │
   │  Format:                        │
   │  ○ Single Elimination           │
   │  ● Round Robin                  │
   │  ○ Everyone vs Everyone         │
   │                                 │
   │  Duration:                      │
   │  [1 week ▼]                     │
   │                                 │
   │  Prize (Optional):              │
   │  [Star Student Certificate]     │
   │                                 │
   │  [Create Tournament]            │
   └─────────────────────────────────┘

4. SUBSCRIPTION & PAYMENTS:
   
   FREE TIER:
   - 1 child profile
   - 5 battles per day
   - Basic progress reports
   - Ads between games
   
   PREMIUM (GH₵30/month):
   - Up to 4 children
   - Unlimited battles
   - Detailed analytics
   - AI insights
   - No ads
   - Priority support
   - Download reports
   
   SCHOOL LICENSE (GH₵500/term/class):
   - Unlimited students per class
   - Teacher dashboard
   - Class tournaments
   - Custom assignments
   - Bulk reporting
   - School branding option

5. BACKEND ENDPOINTS:
   
   Parent:
   - GET /api/parent/dashboard
   - GET /api/parent/children
   - GET /api/parent/child/:id/progress
   - GET /api/parent/child/:id/report?startDate=&endDate=
   - POST /api/parent/subscription/upgrade
   - POST /api/parent/screen-time/set
   
   Teacher:
   - GET /api/teacher/dashboard
   - POST /api/teacher/class/create
   - GET /api/teacher/class/:id
   - GET /api/teacher/class/:id/students
   - GET /api/teacher/class/:id/report
   - POST /api/teacher/tournament/create
   - POST /api/teacher/assignment/create
   
   Reports:
   - POST /api/reports/generate
     * Generates PDF report
     * Returns download URL
   
   Analytics:
   - GET /api/analytics/student/:id
     * Daily activity, topic performance, trends

6. REPORTS (PDF Generation):
   
   Use library: reportlab or weasyprint
   
   Weekly Report Structure:
   ```
   MATHCHAMPIONS GHANA 🇬🇭
   Weekly Progress Report
   
   Student: Kofi Mensah
   Grade: Primary 2
   Period: Feb 5-11, 2026
   
   SUMMARY
   ────────────────────────
   Total Play Time: 2h 15min
   Sessions Completed: 12
   Battles Played: 8 (6 wins, 2 losses)
   Overall Accuracy: 78%
   
   TOPIC PERFORMANCE
   ────────────────────────
   Addition:        ⭐⭐⭐⭐ (92%)
   Subtraction:     ⭐⭐⭐  (75%)
   Multiplication:  ⭐⭐   (58%) ⚠️
   
   ACHIEVEMENTS THIS WEEK
   ────────────────────────
   🔥 5-Day Streak
   ⚡ Speed Demon
   
   RECOMMENDATIONS
   ────────────────────────
   Focus on multiplication tables,
   especially 5x and 10x.
   Consider 10 minutes daily practice.
   
   Parent Signature: _________
   ```

7. SCREEN TIME CONTROLS:
   
   Parent can set:
   - Max minutes per day (15, 30, 45, 60, unlimited)
   - Allowed time windows (e.g., 4pm-6pm only)
   - Auto-lock after time expires
   - Weekly limits
   
   Implementation:
   - Track session start/end times
   - Display timer to child
   - Show "Time's up!" gentle message
   - Option to request more time (parent approval)

8. NOTIFICATIONS:
   
   Parent Notifications (Email):
   - Weekly progress summary
   - Achievement unlocks
   - Areas needing improvement
   - Subscription renewals
   - Tournament invitations
   
   Teacher Notifications:
   - Class performance alerts
   - Student struggling alerts
   - Tournament results
   - New students added

9. MOBILE RESPONSIVE:
   - All dashboards fully mobile responsive
   - Charts render properly on mobile
   - Touch-friendly controls
   - Works on tablets (iPad size)

ACCEPTANCE CRITERIA:
- Parent can view all children's progress
- Charts render correctly (use Chart.js or Recharts)
- PDF reports generate successfully
- Teacher can create and manage classes
- Screen time limits enforce correctly
- Subscription upgrades work (test mode initially)
- All data accurate and real-time
- Mobile dashboards usable

TESTING:
- Create parent with 2 children
- Generate progress report
- Set screen time limit and verify enforcement
- Create teacher account
- Add class with 10 test students
- Start tournament
- Verify all charts and stats accurate

GHANA-SPECIFIC:
- Support Mobile Money payment (MTN, Vodafone)
- School pricing affordable for Ghanaian schools
- Reports culturally appropriate
- Use "Class" not "Grade" (common in Ghana)

Start with database models, then parent dashboard, then teacher dashboard!
```

---

## 🎯 DEPLOYMENT PHASE (BONUS)

### **Cursor Prompt - Deployment:**

```
Prepare the MathChampions Ghana platform for production deployment.

REQUIREMENTS:

1. DOCKER SETUP:
   
   Create docker-compose.yml:
   - Backend (FastAPI)
   - Frontend (Next.js)
   - PostgreSQL
   - Redis
   - Nginx (reverse proxy)
   
   Optimize for production:
   - Multi-stage builds
   - Environment variables
   - Health checks
   - Auto-restart policies

2. ENVIRONMENT CONFIGURATION:
   
   Create .env.example files:
   - Database URLs
   - JWT secret
   - API keys
   - CORS origins
   - Redis URL
   - Payment gateway keys (Mobile Money)

3. PERFORMANCE OPTIMIZATION:
   
   Backend:
   - Enable GZIP compression
   - Redis caching for questions
   - Database connection pooling
   - Rate limiting on endpoints
   
   Frontend:
   - Image optimization (next/image)
   - Code splitting
   - Lazy loading
   - Service worker (PWA)
   - Minify assets

4. SECURITY:
   - HTTPS enforcement
   - CSRF protection
   - SQL injection prevention (Prisma handles this)
   - XSS protection
   - Rate limiting
   - Input validation
   - Secure headers

5. MONITORING:
   - Health check endpoint (/health)
   - Error logging (Sentry)
   - Performance monitoring
   - Database query optimization
   - Uptime monitoring

6. BACKUP STRATEGY:
   - Daily database backups
   - S3 storage for backups
   - User data export feature

7. DEPLOYMENT OPTIONS:
   
   Option A: DigitalOcean (Recommended for Ghana):
   - $20/month droplet (Lagos region - low latency)
   - Managed PostgreSQL
   - Redis cache
   - CDN for assets
   
   Option B: AWS:
   - EC2 instance (ap-south-1 or eu-west-1)
   - RDS PostgreSQL
   - ElastiCache Redis
   - CloudFront CDN
   
   Option C: Railway/Render (Quick start):
   - Easy deployment
   - Auto-scaling
   - But slightly more expensive

8. CI/CD:
   - GitHub Actions workflow
   - Auto-deploy on main branch
   - Run tests before deploy
   - Database migrations

9. DOMAIN & SSL:
   - Register domain (mathchampions.com.gh)
   - Setup SSL (Let's Encrypt)
   - Configure DNS

ACCEPTANCE CRITERIA:
- Docker containers run successfully
- HTTPS works
- Database migrates correctly
- Frontend and backend communicate
- WebSockets work in production
- Mobile Money payments test successfully
- Site loads in <3 seconds on 3G
- All features work on production

GHANA-SPECIFIC:
- Deploy to Lagos/West Africa region for best latency
- Test on Ghana 3G networks
- Ensure works on cheap Android devices
- Mobile Money integration tested

Create deployment documentation with step-by-step instructions!
```

---

## 📝 USAGE INSTRUCTIONS FOR YOU:

**How to use these prompts with Cursor:**

1. **Start with Phase 1**, copy the entire prompt into Cursor
2. Let Cursor build, test thoroughly
3. Once Phase 1 works, move to Phase 2
4. **Don't skip phases** - each builds on the previous
5. Test on mobile after each phase
6. Ask Cursor to fix bugs as they arise

**Tips:**
- You can ask Cursor to break down any phase further if needed
- Request code explanations whenever confused
- Ask for testing instructions
- Request documentation as you go

**Timeline Estimate:**
- Phase 1: 1 week
- Phase 2: 2 weeks  
- Phase 3: 2-3 weeks (most complex)
- Phase 4: 1 week
- Phase 5: 1-2 weeks

**Total: 7-9 weeks for MVP**

Want me to clarify any phase or add more detail to a specific section?