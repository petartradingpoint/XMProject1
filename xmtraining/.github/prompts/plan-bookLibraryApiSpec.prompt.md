# Plan: Book Library API Technical Spec (requirements-analyst)

Produce a single implementation-ready technical specification under `docs/generated/` derived from `docs/openapi.yaml`. The repo is a fresh NestJS 11 starter — no domain code, no TypeORM/validation wiring — so the spec must cover the full `books` and `authors` feature modules (controller / service / repository / entity / DTO) plus app-level wiring, mapping each contract element to NestJS + TypeORM + class-validator, and documenting the 4 resolved decisions. No production source is touched; the analyst only writes the spec markdown.

## Spec file
- Create `docs/generated/` (does not exist yet) and write `001-{YYYYMMDD}-{HHMM}-openapi-initial-spec.md` using local creation time. NNN = `001`.
- First body line: `Artifact base: 001-{YYYYMMDD}-{HHMM}-openapi-initial`.

## Spec contents (sections)
1. **Overview & assumptions** — API title/version, base server `http://localhost:8080/api`, and the 4 confirmed decisions (see below).
2. **App wiring** — global `/api` prefix + port 8080 in `main.ts`; global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`); `TypeOrmModule.forRoot` with in-memory SQLite (`type: 'better-sqlite3'`/`sqlite`, `database: ':memory:'`, `synchronize: true`, `autoLoadEntities: true`) in `app.module.ts`; global `@Catch` exception filter emitting the `ErrorResponse` shape `{ error, message, status }`. List required new deps: `@nestjs/typeorm`, `typeorm`, sqlite driver, `class-validator`, `class-transformer`. Note `tsconfig` `strict: true` should be enabled.
3. **Authors module** (`src/authors/`) — `Author` entity (`@PrimaryGeneratedColumn` id, name, nationality, birthYear, `@OneToMany` books); `AuthorRequest` DTO (`name` required maxLength 255; `nationality` optional maxLength 100; `birthYear` optional int); endpoints GET `/authors`, POST `/authors`, GET `/authors/{id}`, GET `/authors/{id}/books`. **No PUT/DELETE** (contract-only scope). Response mapping incl. nested `books`.
4. **Books module** (`src/books/`) — `Book` entity with `@ManyToOne` author (`authorId` FK) per the chosen relation model; response serializes `author` as the author's **name** string. `BookRequest` DTO (`title`/`author` required maxLength 255, `isbn` required, `publishedYear` required int, `genre` optional). Endpoints GET `/books` (filters `genre`, `author`), POST (201; **409** duplicate ISBN), GET `/books/{id}`, PUT (200; **409** if ISBN collides with another book; 404), DELETE (204; 404).
5. **DTO ↔ class-validator mapping table** — per field decorators (`@IsString`, `@IsNotEmpty`, `@MaxLength`, `@IsInt`, `@IsOptional`), all `readonly`.
6. **Schema ↔ NestJS mapping table** — Book/BookRequest/Author/AuthorRequest/ErrorResponse → entity / DTO / filter type.
7. **Error handling rules** — 400 validation, 404 not found (book/author), 409 duplicate ISBN (POST + PUT), 204 delete; uniform `ErrorResponse` via exception filter.
8. **Test matrix** — per AGENTS.md: Jest unit (service + controller mocked) and Supertest e2e for each endpoint, covering happy path, validation 400, 404, 409, and the two GET filters.

## Decisions
- Book↔Author: add `authorId` FK relation on `Book`; serialize `author` as the author's name in responses.
- Base URL: target the contract — global `/api` prefix, port 8080.
- ISBN uniqueness enforced on **both** POST and PUT (409 on collision).
- Author scope limited to exactly the contract endpoints (no author update/delete).

## Verification
- After the spec is written, confirm the file exists at the dated `001-...-openapi-initial-spec.md` path with the `Artifact base:` line, all 9 endpoints documented, every component schema mapped, and the 4 decisions recorded. (No build/tests run at the spec stage; implementation handoff later runs `npm run build` and `npm test`.)
