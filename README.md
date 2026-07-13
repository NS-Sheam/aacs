# Assignment Auto-Check System

AACS is a two-folder foundation for checking Programming Hero assignments with deterministic automation first and AI-assisted review where full automation is risky.

## Project Structure

```text
client/   # Frontend app workspace
server/   # Express, TypeScript, MongoDB, Redis backend
scripts/  # Local test data and utility assets
```

## Server Setup

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Default server URL: `http://localhost:7777`

Required local services:

- MongoDB running locally or a valid `MONGODB_URI` in `.env`
- Redis running locally on `127.0.0.1:6379`

## Environment Variables

Use `server/.env.example` as the template.

```env
PORT=7777
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/devengers-aacs
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
GITHUB_TOKEN=your_github_pat_here
ANTHROPIC_API_KEY=your_claude_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:7777
```

Keep real keys in `.env` only. Do not commit secrets.

## Test Data

Task 6 assets live in:

- `ENRICHED-JSON-SPEC.md`
- `scripts/test-data/assignment1.json`
- `scripts/test-data/assignment11.json`

These files document the enriched requirement format and provide starter JSON for Tier 1 static UI checks and Tier 2/3 functional checks.

## Model Analysis

Current Mongoose models are organized under `server/src/app/modules/*/*.model.ts`:

- `assignment` stores original and enriched requirements.
- `submission` tracks live URL, GitHub URL, progress, and scores.
- `result` is currently empty and reserved for check results.
- `reviewQueue` stores flagged low-confidence items.
- `auditLog` stores system and instructor actions.

## Useful Commands

```bash
cd server
npm run dev
npx tsc --noEmit
npm run lint
```

## Team Workflow

1. Work from the `dev` branch.
2. Keep feature work in focused branches.
3. Commit source, specs, and test data only.
4. Keep `.env`, logs, outputs, and local AI scratch files out of git.