# BoothTogether

Real-time online photobooth web app where two users create/join a private room, stream live camera via WebRTC, synchronize countdown, capture 4 photos together, and generate a downloadable vertical photobooth strip.

**Author:** Ei Thazin Htay (Junior Software Engineer) Udergraduate

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui, Zustand |
| Backend | Express.js, Socket.IO, Prisma ORM |
| Real-time | WebRTC (video), Socket.IO (signaling) |
| Database | MySQL 8 (Docker) |
| Image Processing | Sharp |
| Storage | Local filesystem (Cloudflare R2 ready) |

## Prerequisites

- Node.js 18+
- pnpm 9+
- Docker (for MySQL)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start MySQL
docker compose up -d

# Run database migrations
cd packages/backend
npx prisma db push
npx prisma generate
cd ../..

# Start backend (port 4000)
pnpm dev:backend

# Start frontend (port 3000)
pnpm dev:frontend
```

Open two browser windows at `http://localhost:3000` to test.

## Project Structure

```
booth2gether/
├── packages/
│   ├── shared/          # Shared types, constants
│   │   └── src/
│   │       ├── types/   # Room, User, Photo, Socket events
│   │       └── constants/
│   ├── backend/
│   │   ├── prisma/      # Database schema
│   │   └── src/
│   │       ├── config/  # Env, database, storage, swagger
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── routes/
│   │       ├── services/
│   │       └── socket/  # Socket.IO handlers
│   └── frontend/
│       └── src/
│           ├── app/         # Next.js pages
│           ├── components/  # UI components
│           ├── hooks/       # useSocket, useWebRTC, useCamera
│           ├── lib/         # API client, socket client
│           └── stores/      # Zustand state
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## How It Works

### Flow

1. **Create Room** — Host creates a room, gets a 6-character code
2. **Join Room** — Guest enters the code to join
3. **Ready Up** — Both users mark themselves as ready
4. **Start Session** — Host starts the session (3-second countdown)
5. **Capture** — 4 photos taken at 2-second intervals, synced via server
6. **Upload** — Each photo uploaded via HTTP to the backend
7. **Process** — Backend generates a vertical photobooth strip using Sharp
8. **Result** — Strip displayed, available for download

### WebRTC Video

- Guest initiates the WebRTC call when both users are in the room
- Host automatically answers when receiving the offer
- ICE candidates exchanged via Socket.IO signaling
- Google STUN servers used for NAT traversal

### Photo Strip Generation

The strip generator creates a 600px wide vertical image containing:
- Dark gradient background with decorative border
- Title: `{Host} & {Guest}` with date
- Two 2x2 photo grids (one per user) with rounded corners
- "MADE WITH BOOTH2GETHER" footer

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/rooms` | Create room |
| GET | `/api/rooms/:code` | Get room details |
| POST | `/api/rooms/:code/join` | Join room |
| DELETE | `/api/rooms/:code` | Close room |
| POST | `/api/photos/upload` | Upload photo (multipart) |
| GET | `/api/photos/:roomCode` | Get room photos |
| POST | `/api/photos/generate` | Generate strip |
| GET | `/api/photos/result/:roomCode` | Get result |

## Socket Events

### Client → Server
- `join-room` — Join a room by code
- `leave-room` — Leave current room
- `ready` — Toggle ready status
- `start-session` — Start capture session (host only)
- `capture` — Signal photo captured
- `webrtc-offer/answer/ice-candidate` — WebRTC signaling

### Server → Client
- `room-joined` — Room data + user list
- `user-joined` / `user-left` — User updates
- `countdown-tick` — Synchronized countdown
- `capture-trigger` — Synchronized capture timing
- `photos-progress` — Upload progress
- `processing-started` / `strip-ready` — Generation status

## Environment Variables

Backend (`packages/backend/.env`):

```env
DATABASE_URL="mysql://root:booth2gether@localhost:3308/booth2gether"
PORT=4000
CORS_ORIGIN="http://localhost:3000"

# Optional: Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
```

## Constants

| Name | Value | Description |
|------|-------|-------------|
| `TOTAL_SHOTS` | 4 | Photos per session |
| `SHOT_INTERVAL_MS` | 2000 | Milliseconds between shots |
| `COUNTDOWN_DURATION` | 3 | Countdown seconds |
| `ROOM_MAX_USERS` | 2 | Max users per room |
| `DISCONNECT_TIMEOUT_SECONDS` | 30 | Before user removed |
| `ROOM_CODE_LENGTH` | 6 | Characters in room code |

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import the GitHub repo
4. Set **Root Directory** to `packages/frontend`
5. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   ```
6. Deploy

### Backend (Render)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect the GitHub repo
3. Settings:
   - **Root Directory:** `packages/backend`
   - **Build Command:** `cd ../shared && pnpm install && pnpm build && cd ../backend && pnpm install && pnpm db:generate`
   - **Start Command:** `pnpm start`
4. Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=mysql://user:pass@host:3306/booth2gether
   CORS_ORIGIN=https://your-frontend.vercel.app
   PORT=4000
   ```
5. Deploy

### Database (PlanetScale / MySQL)

For production, use a managed MySQL service:
- [PlanetScale](https://planetscale.com) (free tier available)
- [Railway MySQL](https://railway.app)
- [AWS RDS](https://aws.amazon.com/rds/)

After creating the database:
```bash
# Update DATABASE_URL in backend .env
# Then run migration
npx prisma db push
npx prisma generate
```

### Storage (Cloudflare R2)

For production photo storage:
1. Create a [Cloudflare R2](https://www.cloudflare.com/products/r2/) bucket
2. Generate API tokens
3. Add to backend environment:
   ```
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_key
   R2_SECRET_ACCESS_KEY=your_secret
   R2_BUCKET_NAME=booth2gether
   R2_PUBLIC_URL=https://pub-xxx.r2.dev
   ```

## Security

- **Helmet** — HTTP security headers
- **Rate Limiting** — 100 requests/15min general, 20 uploads/min
- **Compression** — gzip/deflate responses
- **CORS** — Restricted to configured origin
- **Input Validation** — Zod schema validation
- **File Upload Limits** — 5MB max, JPEG/PNG/WebP only

## Performance

- **Compression** — All responses compressed
- **Caching** — Static uploads cached for 1 day
- **Connection Pooling** — Prisma connection pool
- **WebSocket** — Persistent connections for real-time
- **Image Optimization** — Sharp for server-side processing

## Author

**Ei Thazin Htay** (Junior Software Engineer)
