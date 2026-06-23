# Change Request 001 — Support Multiple Authors per Book — Technical Specification

Artifact base: cr-001-20260622-multiple-authors

Source change request: `docs/change-request-001-multiple-authors.md`
Baseline spec: `docs/generated/001-20260622-1332-openapi-initial-spec.md`
Target stack: Node.js, TypeScript (strict), NestJS 11, TypeORM + in-memory SQLite, class-validator/class-transformer, Jest + Supertest, Angular front-end.
Status: implementation-ready. This document is a specification only — no production code is created or modified here.

---

## 1. Summary

The current API models a book as having exactly **one** author. Change Request 001 requires a book to support **one or more** authors.

The single scalar `author` field (an author *name* on the wire, backed by a `@ManyToOne` relation in persistence) is replaced by an `authors` field — an array of author names on the wire, backed by a `@ManyToMany` relation in persistence.

### 1.1 Worked examples (from the change request)
- "Good Omens" → `["Terry Pratchett", "Neil Gaiman"]`
- "The C Programming Language" → `["Brian Kernighan", "Dennis Ritchie"]`

---

## 2. API Contract Change

### 2.1 `Book` response object

**Before**
```json
{
  "id": 1,
  "title": "Good Omens",
  "author": "Terry Pratchett",
  "isbn": "9780060853983",
  "publishedYear": 1990,
  "genre": "Fantasy"
}
```

**After**
```json
{
  "id": 1,
  "title": "Good Omens",
  "authors": ["Terry Pratchett", "Neil Gaiman"],
  "isbn": "9780060853983",
  "publishedYear": 1990,
  "genre": "Fantasy"
}
```

### 2.2 `BookRequest` payload

**Before**
```json
{
  "title": "Good Omens",
  "author": "Terry Pratchett",
  "isbn": "9780060853983",
  "publishedYear": 1990,
  "genre": "Fantasy"
}
```

**After**
```json
{
  "title": "Good Omens",
  "authors": ["Terry Pratchett", "Neil Gaiman"],
  "isbn": "9780060853983",
  "publishedYear": 1990,
  "genre": "Fantasy"
}
```

### 2.3 `GET /books` query filter
- The existing `author` query parameter (filter by a single author name) is **retained as-is**. A book matches when **any** of its authors equals the supplied name (exact match). No rename to `authors` for the filter — a single-value filter is sufficient and backward-compatible for callers.

### 2.4 `Author.books[]` nested objects
- Each nested `Book` inside an `Author` response now carries `authors` (array) instead of `author` (string), consistent with §2.1.

### 2.5 Endpoints unchanged
No paths, verbs, or status codes change. Only the `Book` / `BookRequest` schema shapes change.

| Method | Path | Change |
|--------|------|--------|
| GET | `/books` | response: `author` → `authors[]`; `author` query filter retained |
| POST | `/books` | request + response: `author` → `authors[]` |
| GET | `/books/{id}` | response: `author` → `authors[]` |
| PUT | `/books/{id}` | request + response: `author` → `authors[]` |
| DELETE | `/books/{id}` | unchanged |
| GET | `/authors` | nested `books[].author` → `books[].authors[]` |
| GET | `/authors/{id}` | nested `books[].author` → `books[].authors[]` |
| GET | `/authors/{id}/books` | each book: `author` → `authors[]` |

---

## 3. Design Decisions

1. **Relation type:** `Book ↔ Author` changes from `@ManyToOne` (single FK `authorId`) to `@ManyToMany` (join table). A book can have many authors; an author can have many books. This replaces the previous one-author-per-book FK model.
2. **Wire format:** `authors` is an array of author **name strings**, mirroring the existing convention where `author` was a name string (not an id). Order is preserved as supplied in the request.
3. **At least one author required:** `authors` must be a non-empty array (`@ArrayNotEmpty`). A book with zero authors is invalid (400).
4. **Auto-provision retained:** each name in `authors` is resolved to an existing `Author` by exact name; if none exists, one is created on the fly (carried over from baseline spec §1.3). Resolution is applied per element.
5. **De-duplication:** duplicate names within a single `authors` array are collapsed to a single author link (case-sensitive exact match), so a book is never linked to the same author twice.
6. **Filter semantics:** `GET /books?author=<name>` returns books where at least one linked author matches by exact name.
7. **No breaking of unrelated rules:** ISBN uniqueness (409 on POST and PUT), full-replace `PUT` semantics, error shape, and global prefix `/api` on port 8080 are unchanged.

---

## 4. Persistence Changes

### 4.1 `Book` entity (`src/books/book.entity.ts`)
Replace the `@ManyToOne` author relation (and the `authorId` column + `@JoinColumn`) with a `@ManyToMany`:

| Field | Before | After |
|-------|--------|-------|
| author | `@ManyToOne(() => Author, a => a.books, { eager: true })` + `@JoinColumn({ name: 'authorId' })` | **removed** |
| authorId | `@Column()` number | **removed** |
| authors | — | `@ManyToMany(() => Author, a => a.books, { eager: true, cascade: false })` + `@JoinTable()` → `Author[]` |

- Keep `eager: true` so reads return authors without explicit `relations`, matching current read behavior.
- `@JoinTable()` lives on the `Book` side (owning side); it creates a `book_authors_author` join table.

### 4.2 `Author` entity (`src/authors/author.entity.ts`)
- Change the inverse side from `@OneToMany(() => Book, b => b.author)` to `@ManyToMany(() => Book, b => b.authors)`.
- Field name `books` is unchanged.

### 4.3 Schema migration
- In-memory SQLite with `synchronize: true` rebuilds the schema on every boot; **no manual migration script is required**. Data is non-persistent across restarts (per AGENTS.md), so there is no production data to migrate within this exercise.
- If a persistent database is later introduced, a migration must: create the `book_authors_author` join table, backfill it from the existing `authorId` FK (one row per book), then drop the `authorId` column.

---

## 5. DTO Changes

### 5.1 `BookRequestDto` (`src/books/dto/book-request.dto.ts`)
Replace the scalar `author` property with an `authors` array.

| Field | Required | Decorators |
|-------|----------|------------|
| title | ✅ | `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` |
| ~~author~~ | — | **removed** |
| authors | ✅ | `@IsArray()` `@ArrayNotEmpty()` `@IsString({ each: true })` `@IsNotEmpty({ each: true })` `@MaxLength(255, { each: true })` |
| isbn | ✅ | `@IsString()` `@IsNotEmpty()` |
| publishedYear | ✅ | `@IsInt()` |
| genre | ❌ | `@IsOptional()` `@IsString()` `@MaxLength(100)` |

- All properties remain `readonly`.
- `authors: readonly string[]`.

### 5.2 `BookResponse` (`src/books/dto/book-response.dto.ts`)
Replace `author: string` with `authors: string[]`:
```ts
export interface BookResponse {
  readonly id: number;
  readonly title: string;
  readonly authors: readonly string[];
  readonly isbn: string;
  readonly publishedYear: number;
  readonly genre: string | null;
}
```

### 5.3 `BookQueryDto` (`src/books/dto/book-query.dto.ts`)
- **Unchanged.** Keeps the optional scalar `author?: string` filter (`@IsOptional()` `@IsString()`), per decision §3.6.

---

## 6. Service Changes

### 6.1 `AuthorsService` (`src/authors/authors.service.ts`)
- Add a batch resolver, e.g. `resolveByNames(names: string[]): Promise<Author[]>`, that de-duplicates names (§3.5) and resolves/auto-provisions each via the existing `resolveByName` logic, preserving input order.
- Keep `resolveByName` (single) available, or have the new method reuse it.
- Update `mapBook(...)` to emit `authors: book.authors.map(a => a.name)` instead of `author: authorName`. The nested-book author names now come from the book's own `authors` relation, **not** the parent author's name.

### 6.2 `BooksService` (`src/books/books.service.ts`)
- **create:** resolve `dto.authors` → `Author[]` via `resolveByNames`; assign `book.authors = authors` (drop `author` / `authorId` assignment). ISBN uniqueness check unchanged.
- **update:** re-resolve `dto.authors` and replace `book.authors` wholesale (full-replace `PUT`). ISBN collision check unchanged.
- **findAll filter:** translate `query.author` into a relation filter against the many-to-many. With TypeORM + SQLite, prefer a `QueryBuilder` join (`.innerJoin('book.authors', 'a').where('a.name = :name', ...)`) because `find({ where: { authors: { name } } })` filtering on a `@ManyToMany` can also drop non-matching authors from the eager result. Using a `QueryBuilder` that filters by the relation but **reloads** full `authors` (e.g. filter to ids, then refetch) ensures the response still lists *all* authors of each matched book, not only the filtered one.
- **toResponse:** emit `authors: book.authors.map(a => a.name)` instead of `author: book.author?.name ?? ''`.

### 6.3 Controller (`src/books/books.controller.ts`)
- **No signature changes.** Types flow through `BookRequestDto` / `BookResponse`; the controller stays thin.

---

## 7. Validation & Error Handling

| Code | When |
|------|------|
| 400 | `authors` missing, not an array, empty array, contains a non-string, empty string, or a name > 255 chars; plus existing field validations; unknown properties via `forbidNonWhitelisted` (e.g. a leftover `author` key is rejected). |
| 404 | book or author not found (unchanged). |
| 409 | duplicate ISBN on `POST` or `PUT /books` (unchanged). |
| 204 | successful `DELETE /books/{id}` (unchanged). |

- Sending the **old** `author` (string) field now triggers 400 (`forbidNonWhitelisted` rejects the unknown property and `authors` is missing). This is the intended breaking change.
- Error body shape `{ error, message, status }` is unchanged.

---

## 8. OpenAPI Contract Update (`openapi.yaml`)

Update the schemas to reflect the new shape:

- `Book.properties`: remove `author` (string); add
  ```yaml
  authors:
    type: array
    items:
      type: string
  ```
- `BookRequest`: in `required`, replace `author` with `authors`; in `properties`, replace `author` with
  ```yaml
  authors:
    type: array
    minItems: 1
    items:
      type: string
      maxLength: 255
  ```
- `GET /books` `author` query parameter: **unchanged** (still a single string, "Filter by author name").
- `Author.books` items continue to `$ref: '#/components/schemas/Book'` — they inherit the new `authors` shape automatically.

---

## 9. Frontend Impact (`frontend/`)

The Angular app consumes `author` and must be updated to `authors[]`. In scope:

- `src/app/models/book.model.ts` — change `author: string` to `authors: string[]` on the book model and any request payload type.
- `src/app/books/book-form/` — replace the single author input with a multi-value input (e.g. add/remove rows or a comma-separated field parsed into a non-empty `string[]`); enforce at least one author client-side.
- `src/app/books/book-list/` and `book-detail/` — render `authors.join(', ')` instead of `author`.
- `src/app/services/book.service.ts` — adjust types only; URLs unchanged.
- `src/app/authors/author-detail/` — nested book rendering uses `authors[]`.

---

## 10. Test Matrix

Per AGENTS.md, every change ships **both** updated Jest unit tests (mocked deps) and Supertest e2e tests.

### 10.1 Unit tests
- `books.service.spec.ts`
  - create: links **multiple** authors; auto-provisions missing authors; de-duplicates repeated names; 409 on duplicate ISBN.
  - update: full-replace of `authors` (adds/removes); 404 unknown book; 409 ISBN collision.
  - findAll: filter by `author` returns books where **any** author matches, and each returned book still lists **all** its authors.
  - toResponse: emits `authors` array in input order.
  - create/update with empty `authors` → rejected before persistence (or covered at DTO level).
- `books.controller.spec.ts` — delegates to service (mocked); 201/200/204 unchanged.
- `authors.service.spec.ts` — `resolveByNames` de-dup + order; nested `books[].authors[]` mapping; `findBooks` returns books with full `authors[]`.

### 10.2 e2e tests
- `books.e2e-spec.ts`
  - POST `/api/books` with `authors: ["A", "B"]` → 201, response has `authors: ["A","B"]`.
  - POST with `authors: []` → 400; POST with legacy `author: "X"` → 400 (unknown property / missing `authors`).
  - GET `/api/books` → each item exposes `authors[]`; `?author=B` returns the book and still shows `["A","B"]`.
  - PUT `/api/books/{id}` replaces authors (e.g. `["A","B"]` → `["C"]`); 409 ISBN collision still enforced.
  - GET `/api/books/{id}` → `authors[]`; DELETE → 204.
- `authors.e2e-spec.ts`
  - GET `/api/authors/{id}/books` → each book exposes `authors[]`.
  - Creating a multi-author book then GET that author shows the book under both authors.
- Assert `ErrorResponse` `{ error, message, status }` on each error path.

### 10.3 Test quality rules
- Behavior-focused; strong assertions (`toEqual` on full arrays, including order).
- Same in-memory SQLite config via the shared test module (`test/test-app.ts`).

---

## 11. Implementation Checklist

1. `book.entity.ts` — `@ManyToMany` + `@JoinTable`; remove `author` / `authorId`.
2. `author.entity.ts` — inverse side `@ManyToMany(() => Book, b => b.authors)`.
3. `book-request.dto.ts` — `authors: string[]` with array validators.
4. `book-response.dto.ts` — `authors: string[]`.
5. `authors.service.ts` — `resolveByNames`; `mapBook` → `authors[]`.
6. `books.service.ts` — create/update/find/toResponse for `authors[]` (QueryBuilder for the filter).
7. `openapi.yaml` — `Book` / `BookRequest` schema updates.
8. Frontend model/components/service (§9).
9. Update unit + e2e tests (§10).
10. Run lint, unit, and e2e suites green.

---

## 12. Open Questions / Variations

1. **Unknown author name on create:** default is auto-provision (carried from baseline §1.3). Alternative: 400 if any name is unknown — confirm if undesired.
2. **Filter by multiple authors:** current scope keeps the single `author` query param. If filtering by several authors at once is needed, a repeated/CSV `authors` param can be added later.
3. **Author ordering & dedup case-sensitivity:** order preserved as submitted; de-dup is exact (case-sensitive) match. Confirm if case-insensitive de-dup is preferred.
4. **Orphaned authors:** removing the last book of an auto-provisioned author leaves the author row in place (no cascade delete). Confirm this is acceptable.
