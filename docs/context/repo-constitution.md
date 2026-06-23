# Repo constitution

## Purpose (one line)

A RESTful **Book Library API** (NestJS) for managing books and their authors, paired with
an Angular single-page front end that consumes it.

## What this repo is

- A backend service exposing CRUD + filtering over **Books** and **Authors** under `/api`,
  contract-defined in [openapi.yaml](../../openapi.yaml).
- An Angular SPA (`frontend/`) providing list / detail / form views for books and authors.
- A teaching / change-request driven codebase: feature work flows through documented change
  requests and generated specs (see [docs/](../)).

## Intents

- Keep the running API **faithful to `openapi.yaml`** — the contract is the source of truth.
- Model the domain cleanly: a **Book** has one or more **Authors** (many-to-many); an
  **Author** has zero or more **Books**.
- Validate all input strictly at the edge (global `ValidationPipe`, whitelist enforced).
- Keep unit and e2e test suites green.

## Non-goals

- No production-grade persistence — the database is in-memory SQLite and resets on restart.
- No authentication / authorization layer (none present).
- No CI/CD automation yet (no pipelines configured).

## Principles

- **Contract first.** Changes to request/response shapes must be reflected in `openapi.yaml`
  and the DTOs together.
- **Strict DTO validation.** Unknown properties are rejected (`forbidNonWhitelisted`); keep
  `class-validator` decorators authoritative.
- **Typed and lint-clean.** `no-explicit-any` is an error; avoid floating promises.
- **Module boundaries.** Feature code lives in its NestJS module (`authors/`, `books/`);
  cross-cutting concerns live in `common/`.

## Constraints (be-careful areas)

> From the onboarding interview — highest-risk zones:

1. **OpenAPI contract** — [openapi.yaml](../../openapi.yaml) must stay in sync with the
   implemented routes, DTOs, and schemas.
2. **Backend entities / DB** — TypeORM with in-memory SQLite and `synchronize: true`. Entity
   changes silently reshape the schema; the Book↔Author `@ManyToMany` (eager on Book) is
   sensitive to mapping changes.
3. **DTO validation** — `class-validator` whitelist rules. Adding/renaming fields without
   updating DTO decorators will cause silent drops or 400s.

## Stakeholders

<!-- SKELETON: no source content for this section.
     Fill in manually or re-run xminit once sources exist. -->

---

### Sources
- openapi.yaml
- docs/change-request-001-multiple-authors.md, docs/generated/*
- src/app.module.ts, src/main.ts, src/books/book.entity.ts, src/authors/author.entity.ts
- .github/copilot-instructions.md (existing)
- Interview answers (be-careful areas; no domain shorthand provided)
