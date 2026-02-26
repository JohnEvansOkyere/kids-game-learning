# MathChampions Ghana - Frontend

Next.js 14 frontend for MathChampions Ghana educational game platform.

## Features

- ✅ Parent authentication (register/login)
- ✅ Student profile creation with avatar selection
- ✅ Student selection screen
- ✅ Kid-friendly, colorful UI
- ✅ Touch-optimized for mobile (60px minimum touch targets)
- ✅ Ghana-specific branding (🇬🇭)
- ✅ Responsive design (works on 360px width)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **HTTP Client:** Axios

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Setup environment variables:**
```bash
cp .env.local.example .env.local
# Edit .env.local with your backend API URL
```

3. **Run development server:**
```bash
npm run dev
```

Application will be available at: `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home (redirects to login)
│   ├── globals.css          # Global styles + Tailwind
│   ├── login/
│   │   └── page.tsx         # Login page
│   ├── register/
│   │   └── page.tsx         # Registration (2-step)
│   ├── student/
│   │   └── select/
│   │       └── page.tsx     # Student selection
│   └── dashboard/
│       └── page.tsx         # Main dashboard
├── components/
│   ├── ui/
│   │   ├── Button.tsx       # Touch-friendly button
│   │   ├── Input.tsx        # Large input field
│   │   ├── Card.tsx         # Colorful card
│   │   └── Avatar.tsx       # Student avatar display
│   └── layout/
│       └── Header.tsx       # App header with Ghana flag
├── lib/
│   ├── api.ts               # API client (axios)
│   └── types.ts             # TypeScript types
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Color Palette

Kid-friendly colors optimized for engagement:

- **Primary:** Bright Blue (#3B82F6)
- **Secondary:** Sunny Yellow (#FBBF24)
- **Success:** Green (#10B981)
- **Danger:** Red (#EF4444)
- **Background:** Light Cream (#FFF9E6)
- **Ghana Colors:** Red (#CE1126), Gold (#FCD116), Green (#006B3F)

## Features

### Authentication Flow

1. **Register:**
   - Step 1: Parent info (name, email, phone, password)
   - Step 2: First child (name, avatar, grade, DOB)
   - Auto-login after registration

2. **Login:**
   - Email + password
   - Redirects to student selection

3. **Student Selection:**
   - Shows all children as colorful cards
   - Option to add more children (max 4)
   - Tap to select and enter dashboard

### UI Components

All components are:
- **Touch-friendly:** Minimum 60px height
- **Colorful:** Vibrant gradients and borders
- **Animated:** Bounce, shake, pulse effects
- **Accessible:** High contrast, large text

### Responsive Design

- Mobile-first approach
- Works on 360px width (cheap Android phones)
- Touch-optimized (no hover states needed)
- Portrait orientation optimized

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Environment Variables

See `.env.local.example` for configuration options.

Required:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

## Ghana-Specific Features

- 🇬🇭 Ghana flag in header
- Phone number format: +233
- Culturally appropriate names in examples
- Local context in future questions

## Next Steps (Future Phases)

- Phase 2: Practice Mode with question bank
- Phase 3: Real-time Battle Mode with WebSockets
- Phase 4: Rewards & Progression System
- Phase 5: Parent/Teacher Dashboard

## License

MIT
