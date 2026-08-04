# Enterprise Architecture Blueprint & Implementation Roadmap
## University Football Franchise & Tournament Platform

This document presents the complete architectural plan, optimized database schema design, backend/frontend engineering specifications, and step-by-step roadmap for building the platform as requested in `roadmap.txt`.

---

## 1. Core Architecture & Global State Machine Design

The application operates as a single deterministic **Global State Machine** with four distinct global phases:

1. **SETUP (Phase 1)**: Admin configures season settings, team budgets, player categories, bidding increments, and registration forms.
2. **PLAYER REGISTRATION (Phase 2)**: Players submit registration details, positions, stats, and photos. Admins approve/reject profiles and assign categories.
3. **LIVE AUCTION (Phase 3)**: Real-time live bidding (Normal & Blind Auction modes) powered by Socket.IO with pessimistic database locking on team wallets.
4. **LIVE TOURNAMENT (Phase 4)**: Fixture generation, match leg scheduling, live match tracking, instant standings calculations, player statistics, and podium reveal.

### Global Phase Enforcement
- **Backend**: `PhaseGuardMiddleware` verifies every REST endpoint & Socket event against the current active phase.
- **Frontend**: Dynamic route guards restrict rendered pages based on `activePhase` state received via initial load / Socket broadcasts.

---

## 2. STEP 1: Database Design (Supabase PostgreSQL + Prisma)

### High-Performance & Concurrency Optimization
- **Pessimistic Row Locking (`FOR UPDATE`)**: Prevents race conditions during simultaneous bids on the same auction session or team wallet.
- **Composite Indexes**:
  - `Bids`: `(auction_session_id, amount DESC, created_at ASC)` for $O(1)$ top-bid extraction.
  - `Players`: `(season_id, registration_status, is_sold)` for instantaneous category filtering.
  - `Matches`: `(tournament_id, status, scheduled_at)` for live match tracking queries.
- **Denormalized Counters**: `TeamWallet` tracks `currentBalance`, `spentAmount`, and `playersBoughtCount` atomically to prevent expensive aggregate computations.
- **Soft Deletes**: `deletedAt` nullable timestamp across Users, Players, and Teams for audit compliance.

---

## 3. Repository Breakdown & Tech Stack

### Repository 1: `football-auction-backend`
- **Stack**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Supabase Free), Socket.IO, Zod, Cloudinary Free, Resend Free.
- **Pattern**: Controller -> Service -> Repository -> Database.
- **No Redis / No Docker / No Kubernetes**.

### Repository 2: `football-auction-frontend`
- **Stack**: React, Vite, TypeScript, TailwindCSS, Shadcn UI, TanStack Query, React Router DOM, React Hook Form, Zod, Socket.IO Client.
- **Pattern**: Modular UI Components + Feature-Based Page Hooks + Realtime Socket Context.

---

## 4. Execution Milestones (Step-by-Step Roadmap)

```
[Milestone 1] Database & Prisma Schema Setup
       │
[Milestone 2] Backend Foundation, Auth & Global State Machine
       │
[Milestone 3] Player Registration Module & Media Uploads
       │
[Milestone 4] Concurrency-Safe Live Auction Engine & Socket Layer
       │
[Milestone 5] Live Tournament Engine, Match Tracking & Standings
       │
[Milestone 6] Frontend Application Setup, UI Design & Phase Pages
       │
[Milestone 7] End-to-End Concurrency & Verification Testing
       │
[Milestone 8] Production Free-Tier Deployment (Render, Vercel, Supabase)
```

### Module Generation Sequence
As specified in `roadmap.txt`, implementation will follow strict module-by-module generation:
1. Complete database models & migrations first.
2. Build backend APIs, services, and Socket channels.
3. Build frontend views, components, and real-time integrations.
