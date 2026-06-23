# Stack

## Backend (root project)

- **Language / framework:** TypeScript 5.7 on NestJS 11
- **Runtime:** Node.js (devType `@types/node` 22; target Node 18+)
- **Package manager:** npm
- **Persistence:** TypeORM 0.3 with `better-sqlite3`, **in-memory** database
  (`database: ':memory:'`, `synchronize: true`, `autoLoadEntities: true`).
  Data is non-persistent — it resets on every restart.
- **Validation:** `class-validator` + `class-transformer`, wired through a global
  `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **Error handling:** global `HttpExceptionFilter` (src/common/filters/http-exception.filter.ts).
- **HTTP:** global prefix `/api`, listens on port `8080` (override via `PORT` env var).
- **API contract:** [openapi.yaml](../../openapi.yaml) (OpenAPI 3.0.0 — Book Library API v1.0.0).

### Backend commands

| Purpose      | Command                                   |
| ------------ | ----------------------------------------- |
| Build        | `npm run build` (nest build)              |
| Dev server   | `npm run start:dev` (nest start --watch)  |
| Prod start   | `npm run start:prod` (node dist/main)     |
| Lint         | `npm run lint` (eslint --fix)             |
| Format       | `npm run format` (prettier --write)       |
| Unit tests   | `npm test` (jest, `*.spec.ts` under src)  |
| Coverage     | `npm run test:cov`                        |
| E2E tests    | `npm run test:e2e` (test/jest-e2e.json + supertest) |

### Backend quality gates

- **Lint:** ESLint flat config (eslint.config.mjs) — `typescript-eslint` `recommendedTypeChecked`
  + Prettier. Notable rules: `@typescript-eslint/no-explicit-any: error`,
  `no-floating-promises: warn`, `no-unsafe-argument: warn`.
- **Typecheck:** via `typescript-eslint` project service (no standalone `tsc --noEmit` script).
- **Test:** Jest 30 + ts-jest. Unit specs colocated as `*.spec.ts` in `src/`; e2e in `test/`.

## Frontend (`frontend/`)

- **Language / framework:** TypeScript 5.4 on Angular 17.3 (standalone components, CLI 17.3).
- **Styling:** TailwindCSS 3.4 (+ PostCSS, autoprefixer).
- **Dev server:** `ng serve` on `http://localhost:4200`; `proxy.conf.json` forwards `/api`
  to the backend at `http://localhost:8080`.
- **Test runner:** Karma + Jasmine.

### Frontend commands

| Purpose    | Command                       |
| ---------- | ----------------------------- |
| Dev server | `npm start` (ng serve)        |
| Build      | `npm run build` (ng build)    |
| Unit tests | `npm test` (ng test, Karma)   |

## CI

No CI pipeline detected (`.github/workflows` absent). Quality gates run locally via the
commands above.

---

### Sources
- package.json, nest-cli.json, tsconfig*.json, eslint.config.mjs
- src/main.ts, src/app.module.ts
- frontend/package.json, frontend/proxy.conf.json, frontend/tailwind.config.js
- openapi.yaml
- Interview answers (be-careful areas)
