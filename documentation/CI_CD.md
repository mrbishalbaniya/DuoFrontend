# DuoFrontend CI/CD

See the full platform guide: [../documentation/CI_CD_GUIDE.md](../documentation/CI_CD_GUIDE.md)

## Quick start

1. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets (optional if Vercel Git is connected).
2. Push to `main` — builds, E2E tests, deploys to Vercel production.
3. PRs get Vercel preview URLs as bot comments.

## Workflows

- `frontend.yml` — tsc, lint, build, E2E, Vercel deploy
- `quality.yml` — ESLint, Prettier, build verification
- `security.yml` — CodeQL, npm audit, gitleaks
- `version.yml` — semver + changelog
- `release.yml` — production release deploy

## Local CI commands

```bash
npm ci
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
```
