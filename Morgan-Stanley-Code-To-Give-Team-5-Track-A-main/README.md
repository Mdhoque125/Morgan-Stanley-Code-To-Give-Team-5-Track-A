# LemonLink

LemonLink helps volunteers organize local flyering campaigns so more families can discover nearby food resources.  
The core challenge is making campaign coordination simple and scalable without requiring staff to manually run each event.

Our solution is a web platform where volunteers can sign up, discover events on a map, join outreach campaigns, create new events, and download area-specific flyers.

## Key Features

- **Landing + onboarding flow:** Dedicated marketing landing page with account login and signup routes.
- **Map-based event discovery:** Interactive Mapbox map with pinned events and popup details.
- **Volunteer event hub:** Browse upcoming events, view attendee counts, and join/leave campaigns.
- **Event creation workflow:** Organizer form with Mapbox geocoding for accurate coordinates.
- **Supabase authentication:** Session-based login/signup and authenticated actions.
- **Admin and assistant tools:** Admin dashboard plus AI-assisted messaging/support pages.

## Features

- **Authentication:** Supabase email/password login and signup with user metadata.
- **Event feed:** Fetches events from FastAPI backend + Supabase data layer.
- **Join/leave attendance:** Authenticated event participation tracking.
- **Flyer generation:** Download localized PDF resources for selected events.
- **Organizer tooling:** Create events with required details and future datetime validation.
- **Admin analytics:** Track flyering activity and related platform insights.

## Tech Stack

### Frontend

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS 4
- **Map:** Mapbox GL (`mapbox-gl`, `react-map-gl`)
- **Auth/Data Client:** Supabase JS client (`@supabase/supabase-js`)
- **State:** React Context + hooks

### Backend

- **Framework:** FastAPI
- **Database/Auth provider:** Supabase (Postgres + Auth)
- **Server:** Uvicorn
- **Auth verification:** JWT verification via Supabase JWKS endpoint
- **API style:** REST endpoints under `/api/*`

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Python 3.10+ (recommended)
- Supabase project with:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Mapbox public token

### Frontend Setup

1. Clone and enter the repo:

   ```bash
   git clone <repository-url>
   cd Morgan-Stanley-Code-To-Give-Team-5-Track-A
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` in the project root:

   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the frontend:

   ```bash
   npm run dev
   ```

5. Open:
   - `http://localhost:3000`

### Backend Setup

1. Move into backend:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create `backend/.env`:

   ```bash
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   ```

5. Start backend API:

   ```bash
   uvicorn main:app --reload
   ```

6. API docs:
   - `http://127.0.0.1:8000/docs`

## Backend Dependencies

Backend dependencies are defined in `backend/requirements.txt`. Core packages include:

- `fastapi` - API framework
- `uvicorn` - ASGI server
- `supabase`, `postgrest`, `realtime`, `storage3`, `supabase-auth`, `supabase-functions` - Supabase integration
- `python-dotenv` - environment management
- `PyJWT`, `cryptography` - token verification and auth support

## Project Structure

```text
├── src/                             # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── hub/page.tsx             # Main volunteer hub
│   │   ├── login/page.tsx           # Login page
│   │   ├── signup/page.tsx          # Signup page
│   │   ├── organizer/page.tsx       # Create event page
│   │   ├── admin/page.tsx           # Admin dashboard
│   │   └── messages/page.tsx        # Messaging / assistant interface
│   ├── components/                  # Shared UI components
│   ├── context/                     # Auth + events context providers
│   ├── data/                        # Mock or seed-like frontend data
│   ├── lib/                         # API clients, helpers, utilities
│   └── types/                       # TypeScript domain types
├── backend/                         # Backend (FastAPI)
│   ├── main.py                      # App entrypoint and router mounting
│   ├── auth.py                      # JWT verification helpers
│   ├── seed.py                      # Supabase seed utilities
│   ├── locations.py                 # Location data used by seed scripts
│   ├── routers/
│   │   ├── events.py                # Event endpoints
│   │   ├── users.py                 # User/profile endpoints
│   │   └── zesty.py                 # Additional assistant endpoints
│   └── requirements.txt             # Python dependencies
├── public/                          # Static assets
├── package.json                     # Frontend dependencies/scripts
└── README.md
```

## Contribution Rules

- Do not push directly to `main`.
- Create a feature branch:

  ```bash
  git checkout -b feature/your-feature-name
  ```

- Open a Pull Request for review.
