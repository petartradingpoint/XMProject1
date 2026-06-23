# Change Request 001 — Frontend (UI) Update for Multiple Authors — Technical Specification

Artifact base: cr-001-20260622-multiple-authors-ui

Source change request: `docs/change-request-001-multiple-authors.md`
Backend spec: `docs/generated/cr-001-20260622-multiple-authors-spec.md`
Target stack: Angular (standalone components), Reactive + Template-driven Forms, Tailwind CSS, RxJS, served via the `/api` proxy (`frontend/proxy.conf.json`).
Status: implementation-ready. This document is a specification only — no production code is created or modified here.

---

## 1. Summary

The REST API now models a book with **one or more authors**: the scalar `author` (string) has been replaced by `authors` (`string[]`) on both the `Book` response and the `BookRequest` payload (see backend spec §2). The Angular UI still assumes a single `author` string and must be updated end-to-end:

- **Models** — `Book.author: string` → `Book.authors: string[]` (and the request type).
- **Book form** — a single author input becomes a repeatable multi-author input that produces a non-empty `string[]`.
- **Book list / detail** — render the joined author names.
- **Author detail** — nested book rows show the book's full author list.

The `GET /books` `author` filter stays a single text box (backend keeps the single-value `author` query param, backend spec §2.3), so the list filter UI is unchanged except for the column it renders.

### 1.1 Worked examples
- "Good Omens" → authors `["Terry Pratchett", "Neil Gaiman"]`, rendered as `Terry Pratchett, Neil Gaiman`.
- "The C Programming Language" → `["Brian Kernighan", "Dennis Ritchie"]`.

---

## 2. Affected Files

| # | File | Change |
|---|------|--------|
| 1 | `src/app/models/book.model.ts` | `author: string` → `authors: string[]` on `Book` and `BookRequest`; `BookQuery.author` unchanged. |
| 2 | `src/app/books/book-form/book-form.component.ts` | Replace single `author` control with a `FormArray` of author name controls; build `authors: string[]` payload; patch the array on edit. |
| 3 | `src/app/books/book-form/book-form.component.html` | Replace single author input with a repeatable add/remove author input list. |
| 4 | `src/app/books/book-list/book-list.component.html` | Render `book.authors.join(', ')` in the Author column. |
| 5 | `src/app/books/book-detail/book-detail.component.html` | Render joined authors in the "by …" line. |
| 6 | `src/app/authors/author-detail/author-detail.component.html` | Add an Authors column (or sub-line) showing each nested book's `authors`. |
| 7 | `src/app/services/book.service.ts` | No logic change; types flow through the updated `Book`/`BookRequest`. URLs and the `author` query param are unchanged. |

> `author.model.ts`, `author-list`, `author-form`, and `author.service.ts` are **not** affected — the `Author` shape is unchanged; only the nested `Book` items within it gain `authors`.

---

## 3. Model Changes (`src/app/models/book.model.ts`)

```ts
export interface Book {
  id: number;
  title: string;
  authors: string[];        // was: author: string
  isbn: string;
  publishedYear: number;
  genre: string | null;
}

export interface BookRequest {
  title: string;
  authors: string[];        // was: author: string
  isbn: string;
  publishedYear: number;
  genre?: string;
}

export interface BookQuery {
  genre?: string;
  author?: string;          // unchanged — single-value filter
}
```

---

## 4. Book Form (`book-form`)

The form must capture **one or more** authors and submit a non-empty `string[]`.

### 4.1 Component (`book-form.component.ts`)

- **Form shape** — replace the single `author` control with a `FormArray`:
  ```ts
  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    authors: this.fb.nonNullable.array<FormControl<string>>(
      [this.createAuthorControl()],
      [Validators.required],            // array must have ≥ 1 control
    ),
    isbn: ['', [Validators.required, Validators.maxLength(255)]],
    publishedYear: [ /* unchanged */ ],
    genre: ['', [Validators.maxLength(100)]],
  });
  ```
- **Helpers:**
  ```ts
  private createAuthorControl(value = ''): FormControl<string> {
    return this.fb.nonNullable.control(value, [
      Validators.required,
      Validators.maxLength(255),
    ]);
  }

  get authors(): FormArray<FormControl<string>> {
    return this.form.controls.authors;
  }

  addAuthor(): void {
    this.authors.push(this.createAuthorControl());
  }

  removeAuthor(index: number): void {
    if (this.authors.length > 1) {
      this.authors.removeAt(index);
    }
  }
  ```
  The last remaining author row cannot be removed (guarantees ≥ 1 author, matching the backend 400 on empty arrays).
- **Load/edit (`loadBook`)** — rebuild the array from `book.authors`:
  ```ts
  this.authors.clear();
  (book.authors.length ? book.authors : ['']).forEach((name) =>
    this.authors.push(this.createAuthorControl(name)),
  );
  this.form.patchValue({ title: book.title, isbn: book.isbn, publishedYear: book.publishedYear, genre: book.genre ?? '' });
  ```
- **Submit (`submit`)** — build the payload, trimming and dropping blank entries; de-duplication is optional (the backend also de-duplicates, backend spec §3.5):
  ```ts
  const authors = raw.authors.map((a) => a.trim()).filter((a) => a.length > 0);
  const payload: BookRequest = {
    title: raw.title.trim(),
    authors,
    isbn: raw.isbn.trim(),
    publishedYear: raw.publishedYear,
    genre: raw.genre.trim() || undefined,
  };
  ```
  If `authors.length === 0` after trimming, treat the form as invalid (mark touched, show the validation hint, do not submit).
- Import `FormArray` / `FormControl` from `@angular/forms` alongside the existing `FormBuilder`, `ReactiveFormsModule`, `Validators`.

### 4.2 Template (`book-form.component.html`)

Replace the single Author block with a repeatable list:

```html
<div formArrayName="authors">
  <label class="mb-1 block text-sm font-medium text-slate-700">Authors</label>

  <div
    *ngFor="let control of authors.controls; let i = index"
    class="mb-2 flex items-center gap-2"
  >
    <input
      [formControlName]="i"
      placeholder="Author name"
      class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
    <button
      type="button"
      (click)="removeAuthor(i)"
      [disabled]="authors.length === 1"
      class="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
      aria-label="Remove author"
    >
      &times;
    </button>
  </div>

  <button
    type="button"
    (click)="addAuthor()"
    class="text-sm font-medium text-emerald-600 hover:text-emerald-700"
  >
    + Add author
  </button>

  <p
    *ngIf="authors.touched && authors.invalid"
    class="mt-1 text-xs text-red-600"
  >
    At least one author is required (each max 255 characters).
  </p>
</div>
```

- Keep the surrounding Title, ISBN, Published Year, and Genre blocks unchanged.
- The submit button stays gated on `form.invalid` (now includes the authors array validators).

---

## 5. Book List (`book-list.component.html`)

- The **Author** column header may read "Authors".
- Replace the cell `{{ book.author }}` with the joined list:
  ```html
  <td class="px-4 py-3">{{ book.authors.join(', ') }}</td>
  ```
- The filter form (genre + author text inputs) is **unchanged**; `book-list.component.ts` continues to send `{ genre, author }` to `BookService.list`.

---

## 6. Book Detail (`book-detail.component.html`)

- Replace the byline:
  ```html
  <p class="text-slate-500">by {{ book.authors.join(', ') }}</p>
  ```
- No other changes; `book-detail.component.ts` is untouched (it reads the `Book` as-is).

---

## 7. Author Detail (`author-detail.component.html`)

The nested book rows currently show Title / Year / Genre. Add the co-authors so multi-author books are clear:

- Add an **Authors** column to the books table header and a cell rendering `book.authors.join(', ')`:
  ```html
  <th class="px-4 py-3">Authors</th>
  ...
  <td class="px-4 py-3">{{ book.authors.join(', ') }}</td>
  ```
- `author-detail.component.ts` and `author.model.ts` are unchanged — `Author.books[]` are typed as `Book[]`, which now carry `authors`.

---

## 8. Service Layer (`book.service.ts`)

- **No code change required.** `list`, `get`, `create`, `update`, `delete` are typed against `Book` / `BookRequest`, so the model edits (§3) propagate automatically.
- The `list` method keeps setting the single `author` query param from `BookQuery.author`.

---

## 9. Validation & UX Rules

| Rule | Behavior |
|------|----------|
| Minimum one author | Form invalid if no non-empty author remains; submit blocked, hint shown. The last author row's remove button is disabled. |
| Per-author max length | 255 chars (mirrors backend `@MaxLength(255, { each: true })`). |
| Trimming | Author names are trimmed; blank rows are dropped before submit. |
| Add/remove | "+ Add author" appends a row; "×" removes a row (except the last). |
| Server errors | Existing `extractErrorMessage` handling is reused; a backend 400 (e.g. empty `authors`) surfaces in the existing error banner. |
| Order | Author order as entered is preserved (sent as an ordered array; backend preserves order, backend spec §3.2). |

---

## 10. Test / Verification Steps

Manual verification against the running stack (`/api` proxy on `localhost:4200`, API on `8080`):

1. **Create (single author):** Add Book with one author → list shows the name; detail byline shows the name.
2. **Create (multiple authors):** Add Book, "+ Add author" twice, enter "Terry Pratchett" and "Neil Gaiman" → list cell and detail byline show `Terry Pratchett, Neil Gaiman`.
3. **Validation:** Remove down to one row (remove disabled), clear it, submit → form blocked with "At least one author is required"; entering 256 chars triggers the same hint.
4. **Edit:** Open an existing multi-author book → all author rows pre-populated; change/add/remove and save → detail reflects the new list (full replace).
5. **Filter:** Filter the list by one author name of a multi-author book → the book appears and still shows all its authors.
6. **Author detail:** Open an author of a multi-author book → the book row lists all co-authors; the same book appears under each co-author.
7. **Build:** `npm run build` (in `frontend/`) compiles with no type errors after the model change.

> If a unit-test harness is later added for the form (`book-form.component.spec.ts`), cover: array starts with one control, add/remove behavior, last-row removal disabled, payload contains a trimmed non-empty `authors` array, and edit pre-population from `book.authors`.

---

## 11. Implementation Checklist

1. `book.model.ts` — `author` → `authors: string[]` on `Book` and `BookRequest`.
2. `book-form.component.ts` — `FormArray` of author controls + add/remove/get helpers; edit pre-population; payload builds `authors[]`.
3. `book-form.component.html` — repeatable author inputs with add/remove and validation hint.
4. `book-list.component.html` — render `authors.join(', ')`.
5. `book-detail.component.html` — byline `authors.join(', ')`.
6. `author-detail.component.html` — add Authors column to nested books table.
7. Run `npm run build` in `frontend/`; perform manual verification (§10).

---

## 12. Out of Scope / Notes

1. **Author entity UI** (`author-list`, `author-form`, `author.model.ts`) — unchanged; the `Author` shape did not change.
2. **Filter by multiple authors** — not added; the list keeps a single `author` filter box (backend keeps the single-value query param).
3. **Autocomplete / chips** — a tag/chip input or author autocomplete is a possible enhancement but is **not** required here; a simple add/remove text-row list satisfies the change.
4. **De-duplication** — optional client-side; the backend already de-duplicates repeated names (backend spec §3.5).
