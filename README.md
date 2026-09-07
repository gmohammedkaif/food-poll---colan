# PollHub — Production-Grade Internal Food Polling Platform

PollHub is a modern, enterprise-ready internal corporate lunch preference polling application built from the ground up on a clean MERN architecture. It enables company employees to vote on their daily lunch catering preference in under 10 seconds, while providing administrators with complete operational control, real-time analytics, and an **anti-credential-misuse security audit engine**.

---

## 🌟 Key Highlights & Design Philosophy

1. **Zero Mock Data**: Operates entirely on a real Express.js backend and real MongoDB/Mongoose database with ObjectIds, atomic upserts, compound unique indexes, and audit collections. Proper empty states are displayed when no records exist.
2. **Server-Side Time Enforcement**: Voting availability is strictly governed by UTC server timestamps (`startAt <= serverTime < endAt`), never trusting browser clocks or frontend timeouts.
3. **Anti-Credential-Misuse System**: When an employee account modifies a lunch vote from a different session ID, device fingerprint, or IP address than original submission, PollHub logs an immutable audit event and raises a priority security alert for administrative review.
4. **Historical Snapshotting**: Food names, culinary descriptions, and photo URLs are snapshotted into each poll option when a poll is created. Modifying or deleting catalog items later will never alter historical poll records.
5. **Dual Image Storage Strategy**: ImageKit SDK integration with environment variables (`IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`) and automatic fallback to a secure local uploads directory served statically.
6. **No Public Registration**: Public sign-up is disabled. Employee accounts and credentials are created and managed exclusively by authorized administrators.
7. **Premium Corporate Cafeteria UI**: Designed with a warm ivory/cream background, charcoal typography, saffron accents (`#EA580C`), emerald status highlights, and accessible keyboard-selectable cards.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Curated Warm Corporate Design System)
- **Icons**: Lucide React
- **Server State & Query**: TanStack Query (React Query v5)
- **Routing**: React Router DOM v7
- **Real-Time**: Socket.io Client
- **Analytics / Visuals**: Recharts
- **Timezone & Dates**: Luxon + date-fns

### Backend
- **Runtime & Server**: Node.js + Express.js + TypeScript (`tsx`)
- **Database**: MongoDB + Mongoose (with embedded `mongodb-memory-server` dev engine fallback)
- **Authentication**: JWT (Short-lived 15m Access Token + Secure HTTP-only 7d Refresh Token) + bcrypt password hashing
- **Security & Headers**: Helmet, CORS, Express Rate Limit, Cookie Parser
- **Real-Time**: Socket.io Server
- **Image Processing**: ImageKit SDK + Multer
- **Validation**: Zod Schemas

---

## 🚀 Quick Start & Development Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### 2. Installation
Install all root, server, and client dependencies:
```bash
# In the root directory (d:/food-poll)
npm run install:all
```
*(Or install inside `/server` and `/client` individually via `npm install`)*

### 3. Environment Variables
Copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend Server Port | `5000` |
| `CLIENT_URL` | Frontend Client URL | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Connection String | *(Leave blank for embedded DB engine)* |
| `JWT_ACCESS_SECRET` | Secret key for access JWTs | Set in `.env` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Set in `.env` |
| `DEFAULT_TIMEZONE` | Business timezone | `Asia/Kolkata` |
| `DEFAULT_POLL_START_TIME` | Default voting start time | `11:00` |
| `DEFAULT_POLL_END_TIME` | Default voting end time | `12:30` |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key | Optional |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key | Optional |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit endpoint URL | Optional |
| `ADMIN_BOOTSTRAP_ID` | Bootstrap Admin Employee ID | `ADMIN001` |
| `ADMIN_BOOTSTRAP_PASSWORD`| Bootstrap Admin Password | `Admin@PollHub2026!` |

### 4. Admin Bootstrap Initializer
Run the server-side bootstrap command to ensure the primary administrator account is created:
```bash
npm run bootstrap:admin
```
Default bootstrap credentials:
- **Employee ID**: `ADMIN001`
- **Password**: `Admin@PollHub2026!`

### 5. Running the Application
Start both the backend server and frontend client concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Server Health**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔒 Security & Anti-Credential-Misuse Architecture

### Threat Model: Shared Office Network & Stolen Credentials
In internal corporate environments, employees often share the same office IP address. Therefore, IP alone cannot identify an individual.

PollHub uses a **multi-signal correlator**:
1. **Authenticated Employee Account** (JWT subject & session token)
2. **Session ID** (Tracked in database per active device)
3. **Client Device Fingerprint** (Hardware/browser signal)
4. **Client IP Address** (With proxy header support)
5. **Immutable Audit Record** (`AuditLog` collection)

### Vote Shift Protection
When an employee submits a vote:
1. `Vote` record is stored with `currentSessionId`, `deviceIdentifier`, `ipAddress`, and `submittedAt`.
2. A `VOTE_CREATED` event is appended to `AuditLog`.

If the employee later modifies their vote:
1. PollHub inspects if `currentSessionId` or `deviceIdentifier` differs from the initial submission.
2. If a discrepancy is detected, an automated **`SecurityAlert`** is generated with `HIGH` severity and flagged as `"Vote modified from divergent session/device - Needs review"`.
3. The previous option snapshot is saved into the immutable `AuditLog` alongside the new option.

---

## 📋 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Sign in with Employee ID + Password
- `POST /api/auth/refresh` — Refresh access token via HTTP-only cookie
- `POST /api/auth/logout` — Revoke active session & clear cookies
- `GET /api/auth/me` — Get current authenticated user profile

### Polls & Voting (`/api/polls`)
- `GET /api/polls/active` — Get today's active lunch poll (server-time computed)
- `GET /api/polls` — List polls (with status/date filters)
- `POST /api/polls` — Create new poll *(Admin only)*
- `POST /api/polls/:id/publish` — Publish poll *(Admin only)*
- `POST /api/polls/:id/close` — Force-close poll *(Admin only)*
- `GET /api/polls/:id/results` — Get aggregated results & leading dish
- `GET /api/polls/:id/voters` — Get voter roster
- `POST /api/polls/:id/vote` — Submit or update lunch vote

### Food Catalog (`/api/foods`)
- `GET /api/foods` — Get food catalog
- `POST /api/foods` — Add food item *(Admin only)*
- `PUT /api/foods/:id` — Update food item *(Admin only)*
- `POST /api/foods/upload` — Upload food photograph via ImageKit *(Admin only)*

### Employee Administration (`/api/employees`)
- `GET /api/employees` — List employees *(Admin only)*
- `POST /api/employees` — Create new employee credentials *(Admin only)*
- `POST /api/employees/:id/reset-password` — Reset password & terminate sessions *(Admin only)*
- `POST /api/employees/:id/revoke-sessions` — Terminate active sessions *(Admin only)*

### Audit & Threat Intelligence (`/api/audit`)
- `GET /api/audit/logs` — Query immutable audit trail *(Admin only)*
- `GET /api/audit/alerts` — List security alerts *(Admin only)*
- `POST /api/audit/alerts/:id/resolve` — Mark security alert as reviewed *(Admin only)*
- `GET /api/audit/overview` — Get threat overview KPIs *(Admin only)*

---

## 🏗️ Production Build & Verification

To compile and produce production bundles:
```bash
npm run build
```
Starts the compiled production server:
```bash
npm start
```
# food-poll---colan
