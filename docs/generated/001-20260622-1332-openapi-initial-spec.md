# Book Library API — Technical Specification

Artifact base: 001-20260622-1332-openapi-initial

Source contract: `docs/openapi.yaml` (Book Library API, v1.0.0, OpenAPI 3.0.0)
Target stack: Node.js, TypeScript (strict), NestJS 11, TypeORM + in-memory SQLite, class-validator/class-transformer, Jest + Supertest.
Status: implementation-ready. This document is a specification only — no production code is created or modified by the requirements-analyst.

---

## 1. Overview & Assumptions

### 1.1 API summary
- **Title / version:** Book Library API, 1.0.0.
- **Description:** RESTful API for managing a book library and its authors.
- **Server / base URL:** `http://localhost:8080/api` — all routes are mounted under the global prefix `/api`.
- **Tags:** Books, Authors.
- **Cross-cutting:** no auth, no pagination, no sorting defined by the contract; all errors share a single `ErrorResponse` shape.

### 1.2 Confirmed decisions
These resolve ambiguities in the OpenAPI contract and are authoritative for implementation:

1. **Book ↔ Author relationship:** add an `authorId` foreign key on the `Book` entity (TypeORM `@ManyToOne` / `@OneToMany` relation). The `author` field in API responses and request payloads is serialized/accepted as the **author's name string**, preserving the contract's wire format while keeping a normalized relation in persistence.
2. **Base URL:** target the contract exactly — global prefix `/api`, listen on port **8080**.
3. **ISBN uniqueness:** enforced on **both** `POST /books` and `PUT /books/{id}`. A collision with another book's ISBN returns **409**. (The contract only documents 409 for POST; PUT extends it for consistency.)
4. **Author scope:** implement only the endpoints in the contract — GET list, GET by id, POST, GET books-by-author. **No author PUT/DELETE.**

### 1.3 Working assumptions
- `BookRequest.author` (a name string) is resolved to an `Author` row. **Assumption:** if no author with that exact name exists, one is created on the fly (auto-provision) so that `GET /authors/{id}/books` stays consistent. (Alternative — 400 if author unknown — is noted as a possible variation; default is auto-provision.)
- `Author.books` nested array and `GET /authors/{id}/books` are both backed by the `authorId` relation.
- `publishedYear` / `birthYear` have no range validation in the contract; none is added beyond `@IsInt`.
- `isbn` has no format/pattern in the contract; only required + string + non-empty is enforced (no ISBN-10/13 checksum).
- Updates are full-replace (`PUT`); no `PATCH`.
- In-memory SQLite (`:memory:`) with `synchronize: true` — data is non-persistent across restarts, which is acceptable per AGENTS.md.

### 1.4 Required new dependencies
Not currently installed (repo is a fresh NestJS 11 starter):
- `@nestjs/typeorm`, `typeorm`
- a SQLite driver — `better-sqlite3` (preferred) or `sqlite3`
- `class-validator`, `class-transformer`
- optional: `@nestjs/mapped-types` (for `PartialType` if needed)

Also enable `strict: true` in `tsconfig.json` (currently only individual strict flags are set), per AGENTS.md.

---

## 2. Application Wiring

### 2.1 Bootstrap (`src/main.ts`)
- `app.setGlobalPrefix('api')`.
- Register global `ValidationPipe`:
  ```ts
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  ```
- Register the global exception filter (see §7).
- Listen on port **8080** (`process.env.PORT ?? 8080`).

### 2.2 Root module (`src/app.module.ts`)
- `TypeOrmModule.forRoot`:
  ```ts
  {
    type: 'better-sqlite3', // or 'sqlite'
    database: ':memory:',
    autoLoadEntities: true,
    synchronize: true,
  }
  ```
- Import `BooksModule` and `AuthorsModule`.
- Register the exception filter via `APP_FILTER` provider (or in `main.ts`).

### 2.3 Layering rules (per AGENTS.md)
- One module per feature; controller / service / repository / entity / DTOs co-located.
- Controllers thin (HTTP only); business logic in services; data access in repositories (TypeORM `Repository<T>` injected, or a thin custom repository wrapper).
- Kebab-case file names; PascalCase classes; camelCase members.

---

## 3. Authors Module (`src/authors/`)

### 3.1 Files
- `authors.module.ts`
- `authors.controller.ts`
- `authors.service.ts`
- `author.entity.ts`
- `dto/author-request.dto.ts`
- (response mapping helper inline in service or `dto/author-response.dto.ts`)

### 3.2 Entity — `Author` (`author.entity.ts`)
| Field | TypeORM | Type | Notes |
|-------|---------|------|-------|
| id | `@PrimaryGeneratedColumn()` | number | int64 |
| name | `@Column()` | string | length 255 |
| nationality | `@Column({ nullable: true })` | string \| null | length 100 |
| birthYear | `@Column({ nullable: true })` | number \| null | |
| books | `@OneToMany(() => Book, b => b.author)` | Book[] | inverse side |

### 3.3 DTO — `AuthorRequest` (`author-request.dto.ts`)
All properties `readonly`.
| Field | Required | Decorators |
|-------|----------|------------|
| name | ✅ | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` |
| nationality | ❌ | `@IsOptional()` `@IsString()` `@MaxLength(100)` |
| birthYear | ❌ | `@IsOptional()` `@IsInt()` |

### 3.4 Endpoints
| Method | Path | Behavior | Responses |
|--------|------|----------|-----------|
| GET | `/authors` | list all authors (with nested `books`) | 200 → `Author[]` |
| POST | `/authors` | create author from `AuthorRequest` | 201 → `Author`; 400 |
| GET | `/authors/{id}` | fetch by id | 200 → `Author`; 404 |
| GET | `/authors/{id}/books` | books for the author | 200 → `Book[]`; 404 (author not found) |

### 3.5 Response mapping
- `Author` response = `{ id, name, nationality, birthYear, books: Book[] }` where each nested `Book` follows §4.5 (with `author` serialized as the author's name).

---

## 4. Books Module (`src/books/`)

### 4.1 Files
- `books.module.ts`
- `books.controller.ts`
- `books.service.ts`
- `book.entity.ts`
- `dto/book-request.dto.ts`
- `dto/book-query.dto.ts` (filters)

### 4.2 Entity — `Book` (`book.entity.ts`)
| Field | TypeORM | Type | Notes |
|-------|---------|------|-------|
| id | `@PrimaryGeneratedColumn()` | number | int64 |
| title | `@Column()` | string | length 255 |
| isbn | `@Column({ unique: true })` | string | unique constraint |
| publishedYear | `@Column()` | number | |
| genre | `@Column({ nullable: true })` | string \| null | |
| author | `@ManyToOne(() => Author, a => a.books, { eager: true })` | Author | FK `authorId` |

> `author` (string) on the wire ↔ `Author` relation in persistence (decision §1.2.1).

### 4.3 DTO — `BookRequest` (`book-request.dto.ts`)
All properties `readonly`.
| Field | Required | Decorators |
|-------|----------|------------|
| title | ✅ | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` |
| author | ✅ | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` (author name) |
| isbn | ✅ | `@IsString()` `@IsNotEmpty()` |
| publishedYear | ✅ | `@IsInt()` |
| genre | ❌ | `@IsOptional()` `@IsString()` |

### 4.4 DTO — `BookQuery` (`book-query.dto.ts`)
| Field | Required | Decorators |
|-------|----------|------------|
| genre | ❌ | `@IsOptional()` `@IsString()` |
| author | ❌ | `@IsOptional()` `@IsString()` (author name) |

### 4.5 Endpoints
| Method | Path | Behavior | Responses |
|--------|------|----------|-----------|
| GET | `/books` | list books; optional filters `genre`, `author` (by author name) | 200 → `Book[]` |
| POST | `/books` | create; resolve/create author by name; enforce unique ISBN | 201 → `Book`; 400; 409 (duplicate ISBN) |
| GET | `/books/{id}` | fetch by id | 200 → `Book`; 404 |
| PUT | `/books/{id}` | full replace; enforce unique ISBN vs other books | 200 → `Book`; 400; 404; 409 (duplicate ISBN) |
| DELETE | `/books/{id}` | delete | 204 (no body); 404 |

### 4.6 Response mapping
- `Book` response = `{ id, title, author, isbn, publishedYear, genre }` where `author` = `book.author.name`.

### 4.7 Service business rules
- **Create:** look up `Author` by `author` name; auto-provision if missing (§1.3). Check ISBN uniqueness → `ConflictException` (409) on collision.
- **Update:** ensure book exists (404 else). If ISBN changes, ensure no other book owns it (409 else). Re-resolve author by name. Replace all fields.
- **Filters:** `genre` exact match; `author` match by related author name.
- **Delete:** 404 if missing; else 204.

---

## 5. DTO ↔ class-validator Mapping (summary)

| DTO | Field | Validators |
|-----|-------|-----------|
| AuthorRequest | name | `@IsString` `@IsNotEmpty` `@MaxLength(255)` |
| AuthorRequest | nationality | `@IsOptional` `@IsString` `@MaxLength(100)` |
| AuthorRequest | birthYear | `@IsOptional` `@IsInt` |
| BookRequest | title | `@IsString` `@IsNotEmpty` `@MaxLength(255)` |
| BookRequest | author | `@IsString` `@IsNotEmpty` `@MaxLength(255)` |
| BookRequest | isbn | `@IsString` `@IsNotEmpty` |
| BookRequest | publishedYear | `@IsInt` |
| BookRequest | genre | `@IsOptional` `@IsString` |
| BookQuery | genre | `@IsOptional` `@IsString` |
| BookQuery | author | `@IsOptional` `@IsString` |

All DTO properties are `readonly`. `ValidationPipe` `transform: true` enables numeric coercion where applicable.

---

## 6. Schema ↔ NestJS Mapping

| OpenAPI schema | NestJS counterpart |
|----------------|--------------------|
| `Book` | `Book` entity (TypeORM) + response mapping (`author` → name) |
| `BookRequest` | `BookRequest` DTO (class-validator) |
| `Author` | `Author` entity (TypeORM) + nested books mapping |
| `AuthorRequest` | `AuthorRequest` DTO (class-validator) |
| `ErrorResponse` | produced by global exception filter (not a DTO) |
| query `genre`,`author` | `BookQuery` DTO |

---

## 7. Error Handling

### 7.1 Uniform error shape (`ErrorResponse`)
```json
{ "error": "string", "message": "string", "status": 0 }
```

### 7.2 Global exception filter
- `@Catch()` filter catches `HttpException` (and unknown errors → 500).
- Maps to the `ErrorResponse` body: `error` = HTTP reason phrase / exception name, `message` = exception message(s), `status` = numeric status code.
- Registered globally (`APP_FILTER` or `app.useGlobalFilters`).

### 7.3 Status code rules
| Code | When |
|------|------|
| 400 | class-validator failure (missing/invalid fields, unknown properties via `forbidNonWhitelisted`) |
| 404 | book or author not found (`NotFoundException`) |
| 409 | duplicate ISBN on `POST` or `PUT /books` (`ConflictException`) |
| 204 | successful `DELETE /books/{id}` (no body) |

---

## 8. Test Matrix

Per AGENTS.md, every feature ships **both** a Jest unit test (mocked dependencies) and a Supertest e2e test against the running app.

### 8.1 Unit tests (Jest, mocked deps)
- `authors.service.spec.ts` — create, find all, find one (+404 path), books-by-author (+404), author auto-provision logic.
- `authors.controller.spec.ts` — delegates to service (mocked); correct status codes.
- `books.service.spec.ts` — create (happy, 409 duplicate ISBN, author resolve/auto-provision), update (happy, 404, 409 ISBN collision), find all + filters (genre, author), find one (+404), delete (+404).
- `books.controller.spec.ts` — delegates to service (mocked); status codes incl. 201/204.

### 8.2 e2e tests (Supertest, real app + in-memory SQLite)
- `authors.e2e-spec.ts`:
  - POST `/api/authors` → 201; validation 400 (missing name); maxLength 400.
  - GET `/api/authors` → 200 list.
  - GET `/api/authors/{id}` → 200; 404 unknown id.
  - GET `/api/authors/{id}/books` → 200; 404 unknown author.
- `books.e2e-spec.ts`:
  - POST `/api/books` → 201; 400 validation; 409 duplicate ISBN.
  - GET `/api/books` → 200; filter by `genre`; filter by `author`.
  - GET `/api/books/{id}` → 200; 404.
  - PUT `/api/books/{id}` → 200; 400; 404; 409 ISBN collision.
  - DELETE `/api/books/{id}` → 204; 404.
- Assert `ErrorResponse` shape `{ error, message, status }` on each error path.

### 8.3 Test quality rules
- Behavior-focused; do not weaken assertions (`toEqual` over `toBeDefined`).
- Use a dedicated test module with the same in-memory SQLite config.

---

## 9. Open Questions / Variations
1. **Unknown author on book create:** default is auto-provision (§1.3). Alternative: return 400 if author name unknown — confirm if undesired.
2. **`PUT` author re-resolution:** changing a book's author name auto-provisions a new author if needed (consistent with create).
3. **ISBN format:** not validated beyond non-empty string; add `@Matches` for ISBN-10/13 only if later required.
4. **Author update/delete:** intentionally out of scope (decision §1.2.4).
