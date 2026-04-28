# Stride - AI-Powered Running Training App

A web-first PWA that helps runners train for races from 5K to 50K with AI coaching, automatic workout logging via Strava, and adaptive plan adjustments.

## Features

- 🤖 **AI Coach** - Personalized feedback powered by Google Gemini
- 🔗 **Strava Integration** - Auto-sync your workouts
- 📅 **Smart Planning** - Adaptive training plans for 5K, 10K, Half Marathon, Marathon, and 50K
- 🌱 **Positive Focus** - Encouraging, judgment-free training approach
- 📊 **Progress Tracking** - Monitor your journey without comparison to others

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini (gemini-1.5-flash)
- **Fitness API**: Strava OAuth2
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A Supabase account
- A Google Gemini API key

### Installation

1. **Clone and install dependencies**
   ```bash
   cd stride-app
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   
   ```env
   # Supabase (create project at https://supabase.com)
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # Google Gemini AI (get free key at https://ai.google.dev/)
   GEMINI_API_KEY=your-gemini-api-key
   
   # Strava OAuth (optional for now)
   STRAVA_CLIENT_ID=your-client-id
   STRAVA_CLIENT_SECRET=your-client-secret
   NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3001/api/strava/callback
   ```

3. **Set up Supabase database**
   
   In your Supabase project dashboard:
   - Go to SQL Editor
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`
   - This creates all necessary tables with Row Level Security

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3001](http://localhost:3001)

## Project Structure

```
stride-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   ├── globals.css             # Custom CSS
│   │   ├── plan/page.tsx           # Training plan view
│   │   ├── login/page.tsx          # Login page
│   │   └── api/
│   │       └── ai/feedback/route.ts    # AI feedback API
│   ├── components/
│   │   └── SessionCard.tsx         # Session card component
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   └── server.ts           # Server client
│   │   └── gemini.ts               # AI integration
│   └── types/
│       ├── database.ts             # Database types
│       └── index.ts                # Domain types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
└── package.json
```

## Database Schema

### Tables

- **profiles** - User profiles with personalization data (age, gender, experience, etc.)
- **plan_templates** - Pre-built training plans for different race distances
- **training_plans** - User's active training plans
- **sessions** - Individual training sessions
- **workout_logs** - Completed workout data with AI feedback

## Development Roadmap

### Phase 2: Project Setup ✅
- [x] Next.js setup with TypeScript
- [x] Supabase configuration
- [x] UI components ported from demo
- [x] Gemini AI integration

### Phase 3: Core MVP (In Progress)
- [ ] Training plan templates (5K, 10K, HM, Marathon, 50K)
- [ ] Strava OAuth integration
- [ ] Automatic workout matching
- [ ] Basic AI coach feedback

### Phase 4: Intelligence Layer
- [ ] Calendar integration
- [ ] AI-powered plan adjustments
- [ ] Progress analytics

### Phase 5: Polish & Launch
- [ ] Positive-sum gamification
- [ ] PWA optimization
- [ ] Testing and deployment

## Contributing

This is a personal project being developed iteratively. Contributions welcome once MVP is complete.

## License

MIT
