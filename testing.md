# 🧪 Football Auction & Tournament Platform - End-to-End Testing Guideline

This document provides a step-by-step testing manual to verify all features, roles, state machine phases, APIs, and real-time Socket.IO broadcasts for the **Premier Football Auction & Tournament Platform**.

---

## 1. System Health & Environment Check

Before initiating testing, verify that both the backend API server and frontend client application are running.

### Steps to Run Local Environment
1. **Backend Server**:
   ```bash
   cd football-auction-backend
   npm run dev
   ```
   - **Expected Output**: `🚀 Football Auction Backend running on port 5001 in [development] mode` and `✅ PostgreSQL Database connected successfully via Prisma`.

2. **Frontend Client**:
   ```bash
   cd football-auction-frontend
   npm run dev
   ```
   - **Expected Output**: `Vite v8.2.0 ready at http://localhost:5173/`.

---

## 2. Feature Test Cases & Step-by-Step Guidelines

---

### Test Suite A: Authentication & Super Admin Approval Workflow

#### Test Case A1: Public Guest / Player Registration & Login
* **Steps**:
  1. Open `http://localhost:5173/register`.
  2. Select Role `PLAYER`, enter Full Name, Email, and Password. Click **Sign Up**.
* **Expected Output**:
  - Account created successfully.
  - Automatically logged in and redirected to the Home Page (`/`).
  - User badge in top-right navbar shows name and `PLAYER` role badge.

#### Test Case A2: Admin Registration & Super Admin Approval Requirement
* **Steps**:
  1. Open `http://localhost:5173/register`.
  2. Select Role `ADMIN`, enter Full Name, Email, and Password. Click **Sign Up**.
* **Expected Output**:
  - Purple alert appears stating: `"Admin accounts require approval from a Super Admin before logging in."`
  - Success message displays: `"Registration Submitted! A Super Admin must approve your account before you can log in."`
  - **No auto-login** occurs.
* **Attempting Unapproved Admin Login**:
  1. Go to `http://localhost:5173/login`.
  2. Enter the unapproved Admin credentials and click **Login**.
  - **Expected Output**: Error message appears: `"Your Admin account is pending approval by a Super Admin"`.

#### Test Case A3: Super Admin Approval of Pending Admins
* **Steps**:
  1. Log in with a `SUPER_ADMIN` account.
  2. Navigate to `http://localhost:5173/admin`.
  3. Locate the **Pending Admin Account Approvals** section.
  4. Click **Approve Admin** next to the pending Admin user.
* **Expected Output**:
  - Success banner displays: `"Admin account approved successfully"`.
  - Log out of Super Admin and log in with the newly approved Admin account.
  - Login succeeds and access to `/admin` is granted.

---

### Test Suite B: Global State Machine Phase Controls

#### Test Case B1: Switching Global Phases (Phase 1 to Phase 4)
* **Steps**:
  1. Log in as `ADMIN` or `SUPER_ADMIN`.
  2. Navigate to `http://localhost:5173/admin`.
  3. Click on the phase cards in order:
     - **Phase 1: Setup**
     - **Phase 2: Player Registration**
     - **Phase 3: Live Auction**
     - **Phase 4: Live Tournament**
* **Expected Output**:
  - Active phase badge updates dynamically across all connected browser tabs (`Phase 1` -> `Phase 2` -> `Phase 3` -> `Phase 4`).
  - Navbar updates available routes based on phase:
    - In **Phase 2**: `Register Player` link appears.
    - In **Phase 3**: `Live Auction Room` animated button appears.
    - In **Phase 4**: `Tournament Matches` button appears.

---

### Test Suite C: Player Profile Registration & Admin Verification

#### Test Case C1: Submitting Player Profile (Phase 2)
* **Steps**:
  1. Ensure Global Phase is set to `PLAYER_REGISTRATION`.
  2. Log in as a `PLAYER`.
  3. Click **Register Player** (`/register-player`).
  4. Select Primary Position (e.g., `FORWARD`), Secondary Position (optional), Jersey Number (e.g., `10`), and enter valid Season ID.
  5. Click **Submit Profile for Verification**.
* **Expected Output**:
  - Green confirmation banner appears: `✅ Registration submitted successfully! Redirecting to player roster...`.
  - Redirected to `/roster`. Player appears with status badge `PENDING`.

#### Test Case C2: Admin Verification of Registered Players
* **Steps**:
  1. Log in as `ADMIN`.
  2. Navigate to `/admin` -> **Player Registration Approvals**.
  3. Click **Approve Profile** next to a pending player.
* **Expected Output**:
  - Success message: `"Player profile approved successfully"`.
  - Player status changes to `APPROVED` in `/roster`.

---

### Test Suite D: Real-Time Live Bidding Engine (Phase 3)

#### Test Case D1: Team Owner Real-Time Bidding
* **Steps**:
  1. Ensure Global Phase is set to `LIVE_AUCTION`.
  2. Admin launches an active auction session for an approved player (`POST /api/v1/auction/session`).
  3. Open two browser windows side-by-side:
     - **Window 1**: Logged in as `TEAM_OWNER` (Team A).
     - **Window 2**: Logged in as `PUBLIC_GUEST` or `TEAM_OWNER` (Team B).
  4. Both windows navigate to `http://localhost:5173/auction`.
  5. In Window 1, click **+$50** or **Place Bid**.
* **Expected Output**:
  - Current Top Bid updates instantly in **both windows** via Socket.IO without page refresh.
  - Timer resets back to 30 seconds.
  - Live Bidding Feed on the right panel prepends the new top bid with team name and amount.

#### Test Case D2: Atomic Wallet & Budget Lock Checks
* **Steps**:
  1. Log in as a `TEAM_OWNER` whose wallet balance is lower than the target bid amount (e.g., $10).
  2. Attempt to place a bid higher than available balance ($500).
* **Expected Output**:
  - Error banner displays: `⚠️ Insufficient budget balance. Available: $10`. Bid is rejected by database transaction.

---

### Test Suite E: Live Tournament Fixtures & Standings (Phase 4)

#### Test Case E1: Dynamic Points Table & Match Results
* **Steps**:
  1. Ensure Global Phase is set to `LIVE_TOURNAMENT`.
  2. Navigate to `http://localhost:5173/tournament`.
* **Expected Output**:
  - Standings table renders Pos, Team Code, Played (P), Won (W), Drawn (D), Lost (L), Goals For (GF), Goals Against (GA), Goal Difference (GD), and Points (PTS).
  - Match Fixtures list displays upcoming and completed matches.

---

## 3. Quick Command Summary Matrix

| Verification Scope | Terminal Command | Expected Outcome |
| :--- | :--- | :--- |
| **Backend Types** | `cd football-auction-backend && npx tsc --noEmit` | `0 errors` |
| **Frontend Types** | `cd football-auction-frontend && npx tsc -b` | `0 errors` |
| **DB Schema Sync** | `cd football-auction-backend && npx prisma db push` | `Database is already in sync` |
| **Frontend Production Build** | `cd football-auction-frontend && npm run build` | `dist/assets/index-*.css 37+ kB built cleanly` |
