# DuoFrontend

Next.js frontend for **Duo** — matrimonial matching with chat, insights, and profile onboarding.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API defaults to `http://localhost:8001/api`.

On Windows, if OneDrive blocks files locally, use:

```powershell
.\dev-local.ps1
```

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

| Workflow | File | What it does |
|----------|------|--------------|
| **CI** | `.github/workflows/ci.yml` | `npm ci`, ESLint, production build |
| **Deploy** | `.github/workflows/deploy.yml` | Deploy to Vercel on push to `main` |

### Deploy frontend (Vercel)

**Option A — Vercel dashboard (recommended)**

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Set `NEXT_PUBLIC_API_URL` to your backend API URL (e.g. `https://duo-backend.onrender.com/api`).
3. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for Google sign-in.
4. Vercel deploys automatically on every push to `main`.

**Option B — GitHub Actions**

1. Create a Vercel token and link the project (`vercel link`).
2. Add these GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
3. Pushes to `main` will run the Deploy workflow.

## Stack

- Next.js App Router
- React 19 + TypeScript
- Tailwind CSS
