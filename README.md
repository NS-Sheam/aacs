# AACS — Automated Assignment Checking System
**Team Devengers · Programming Hero Hackathon · Batch 12**

## What this does

Replaces manual instructor review of student live site assignments. Instructors upload their existing requirement JSON — the system automatically checks student submissions for UI correctness, GitHub activity, and functional requirements using Playwright, Octokit, and Gemini AI.

**Automation coverage:**
- Assignment 1 (static UI): ~85% automated
- Assignment 11 (full-stack portal): ~65% automated (Tier 1 + Tier 2)
- Low-confidence results → instructor review queue (never silently wrong)

---

## Team

| Member | Role |
|---|---|
| MD. Nazmus Sakib Sheam | Lead · Architect · AI Integration |
| Nasib Hossain | Backend · API & Queue |
| Mursalin Hossain | Playwright Engine · Automation |
| Jakaria Masum | Frontend · Next.js Portal |
| Md. Isa Ahamed San | Additional Backend · Tier 2 & DB |

---

## Tech stack

| Layer | Technology |
|---|---|
| AI Intent Parser | Gemini API (`gemini-1.5-flash`) |
| Browser automation | Node.js + Playwright |
| GitHub checker | Octokit REST SDK |
| Job queue | BullMQ + Redis (local) |
| Backend API | Express + TypeScript |
| Database | MongoDB + Mongoose |
| Frontend | Next.js (App Router) |

---

## Prerequisites

- Node.js v18+
- MongoDB Community (local) — `mongod`
- Redis (local) — `redis-server`
- GitHub Personal Access Token
- Google Gemini API Key

---

## Local setup

```bash
git clone https://github.com/NS-Sheam/aacs
cd aacs
cp .env.example .env
# Fill in: GITHUB_TOKEN and GEMINI_API_KEY in .env
```

**Install dependencies:**
```bash
cd server && npm install
cd ../client && npm install
```

**Run (4 terminals):**
```bash
# Terminal 1
mongod

# Terminal 2
redis-server

# Terminal 3
cd server && npm run dev

# Terminal 4
cd client && npm run dev
```

**Seed test data:**
```bash
cd server
npx ts-node ../scripts/seedTestDb.ts

# Reset and re-seed:
npx ts-node ../scripts/seedTestDb.ts --reset
```

---

## Environment variables

```env
MONGODB_URI=mongodb://localhost:27017/devengers-aacs
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
GITHUB_TOKEN=your_github_pat_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/assignments` | Create assignment + trigger Gemini enrichment |
| GET | `/api/assignments?batch=12` | List assignments by batch |
| GET | `/api/assignments/batch/12/no/1` | Get by batch + assignment number |
| GET | `/api/assignments/:id/enriched` | Get enriched requirements |
| POST | `/api/assignments/:id/enrich` | Manually trigger enrichment |
| PATCH | `/api/assignments/:id` | Update JSON — re-enriches |
| PATCH | `/api/assignments/:id/activate` | Activate assignment |
| POST | `/api/submissions` | Submit student URL for checking |
| POST | `/api/submissions/bulk` | Submit multiple students at once |
| GET | `/api/submissions/:id/status` | Real-time job progress |
| GET | `/api/results/:submissionId` | Per-section results |
| GET | `/api/results/:submissionId/summary` | Score summary |
| GET | `/api/results/:submissionId/export` | Export in instructor JSON format |
| GET | `/api/review-queue` | All flagged items |
| PATCH | `/api/review-queue/:itemId` | Instructor override (pass/fail) |
| GET | `/api/audit/:submissionId` | Full audit trail |

---

## Architecture

```
Instructor JSON (existing format)
        ↓
Gemini AI Intent Parser
        ↓ (enriches: checkType, selectors, automationTier)
BullMQ Job Queue
        ↓
┌───────────────┬──────────────────┐
▼               ▼                  ▼
GitHub        Playwright         Playwright
Checker       Tier 1             Tier 2
(Octokit)     (static UI)        (auth state)
│               │                  │
└───────────────┴──────────────────┘
                ↓
        Confidence Router (threshold: 0.75)
                ↓
    ┌───────────────────────────┐
    ▼                           ▼
Auto-committed              Review Queue
Result                      (instructor decision)
    │                           │
    └───────────┬───────────────┘
                ▼
        Score Aggregator
                ↓
        Export JSON (instructor portal format)
```

---

## Known limitations

- Tier 3 (AI Vision matching) deferred post-hackathon
- Payment flow testing — UI presence only (no live transactions)
- Private student repos return graceful error (not checked)
- Gemini enrichment takes 10–30 seconds per assignment depending on size