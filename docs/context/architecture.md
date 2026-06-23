# Architecture

## Top-level layout

```
/
├── src/                  NestJS backend
│   ├── main.ts           bootstrap: global prefix /api, ValidationPipe, HttpExceptionFilter, port 8080
│   ├── app.module.ts     root module: TypeORM (in-memory sqlite) + AuthorsModule + BooksModule
│   ├── authors/          Author feature module
│   │   ├── author.entity.ts        TypeORM entity (ManyToMany -> Book)
│   │   ├── authors.controller.ts   REST controller (+ .spec.ts)
│   │   ├── authors.service.ts      business logic (+ .spec.ts)
│   │   ├── authors.module.ts
│   │   └── dto/                     request/response DTOs
│   ├── books/            Book feature module
│   │   ├── book.entity.ts          TypeORM entity (ManyToMany -> Author, eager, @JoinTable)
│   │   ├── books.controller.ts     REST controller (+ .spec.ts)
│   │   ├── books.service.ts        business logic (+ .spec.ts)
│   │   ├── books.module.ts
│   │   └── dto/                     book-query / book-request / book-response DTOs
│   └── common/
│       └── filters/http-exception.filter.ts   global exception filter
├── test/                 e2e specs (authors.e2e-spec.ts, books.e2e-spec.ts) + test-app harness
├── frontend/             Angular 17 SPA
│   └── src/app/
│       ├── authors/      author-list / author-detail / author-form components
│       ├── books/        book-list / book-detail / book-form components
│       ├── models/       author.model.ts, book.model.ts
│       ├── services/     author.service.ts, book.service.ts (HTTP clients)
│       └── shared/       http-error.ts
├── openapi.yaml          API contract (OpenAPI 3.0.0)
├── docs/                 change requests + generated specs/reviews
├── _bmad/, _bmad-output/ BMAD-method tooling & artifacts
├── .specify/             SpecKit framework
└── .github/              copilot-instructions, agents, prompts, skills
```

## Backend request flow

```
HTTP /api/* → Controller → Service → TypeORM Repository → in-memory SQLite
                  ↑              ↓
          ValidationPipe   HttpExceptionFilter
          (whitelist,      (uniform error shape)
           transform)
```

- **Entry point:** [src/main.ts](../../src/main.ts) — global `/api` prefix, strict
  `ValidationPipe`, global `HttpExceptionFilter`, port 8080 (`PORT` override).
- **Root module:** [src/app.module.ts](../../src/app.module.ts) — registers TypeORM
  (better-sqlite3, `:memory:`, `synchronize: true`, `autoLoadEntities: true`) and the two
  feature modules.

## Domain model

- **Book** — `id`, `title`, `isbn` (unique), `publishedYear`, `genre` (nullable),
  `authors` (`@ManyToMany` → Author, **eager**, owns the `@JoinTable`).
- **Author** — `id`, `name`, `nationality` (nullable), `birthYear` (nullable),
  `books` (`@ManyToMany` → Book, inverse side).
- Relationship: **many-to-many** between Book and Author. Book is the owning side; loading a
  book eagerly loads its authors.

## Frontend ↔ backend integration

- Angular dev server proxies `/api` → `http://localhost:8080` via
  [frontend/proxy.conf.json](../../frontend/proxy.conf.json).
- `author.service.ts` / `book.service.ts` are the HTTP clients; `models/*.model.ts` mirror
  the API schemas.

## Decisions (ADRs)

<!-- SKELETON: no ADR/TDR records found in the repo.
     Add docs/adr/ entries or re-run xminit once decisions are recorded. -->

---

### Sources
- src/ tree (main.ts, app.module.ts, books/, authors/, common/)
- src/books/book.entity.ts, src/authors/author.entity.ts
- frontend/src/app tree, frontend/proxy.conf.json
- openapi.yaml
