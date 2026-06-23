# AI instructions

## Repo purpose (one line)
A RESTful Book Library API (NestJS) for managing books and their authors, with an Angular SPA front end that consumes it.

## Stack (one line)
TypeScript on NestJS 11 (backend) + Angular 17 (frontend) — full detail in docs/context/stack.md.

## Quality gates
- Lint: `npm run lint` (eslint --fix; `no-explicit-any` is an error)
- Typecheck: not a standalone script — enforced via typescript-eslint project service
- Test: `npm test` (Jest unit), `npm run test:e2e` (e2e); frontend `npm test` (Karma) in `frontend/`
- Build: `npm run build` (nest build); frontend `npm run build` (ng build) in `frontend/`

## How we work
- Contract first: keep `openapi.yaml` in sync with routes, DTOs, and schemas on every API change.
- Strict DTO validation: the global `ValidationPipe` enforces whitelist + `forbidNonWhitelisted`; keep `class-validator` decorators authoritative when adding/renaming fields.
- Mind the DB: TypeORM uses in-memory SQLite with `synchronize: true` — entity changes silently reshape the schema and data resets on restart. The Book↔Author `@ManyToMany` (eager on Book) is sensitive to mapping changes.
- Respect module boundaries: feature code in `authors/` and `books/`; cross-cutting concerns in `common/`.
- Keep it typed and lint-clean: no `any`, no floating promises.
- Don't edit generated/build output (`dist/`, `coverage/`).

## Reference
- Identity & scope: docs/context/repo-constitution.md
- Architecture: docs/context/architecture.md
- Stack & commands: docs/context/stack.md
- Historical work: docs/archive/
