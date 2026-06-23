# Tasks: Book Rating

**Input**: Design documents from `/specs/001-book-rating/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included because the feature spec defines independent test criteria for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the shared contract and model surface that all story work depends on.

- [x] T001 [P] Update the OpenAPI book schemas to include `rating` in `openapi.yaml`
- [x] T002 [P] Add `rating` to the shared frontend book types in `frontend/src/app/models/book.model.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend persistence and DTO plumbing that MUST be complete before any user story work can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Add a nullable `rating` column to the book entity in `src/books/book.entity.ts`
- [x] T004 [P] Extend request/response DTOs and service mapping for `rating` in `src/books/dto/book-request.dto.ts`, `src/books/dto/book-response.dto.ts`, and `src/books/books.service.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Rate a Book from Details (Priority: P1) 🎯 MVP

**Goal**: A reader can open a book details screen, choose a rating from 1 to 5 stars, and save that rating for the book.

**Independent Test**: Open a book details screen, select a star rating, and confirm the selected value is retained after refresh and re-open.

### Tests for User Story 1

- [x] T005 [P] [US1] Add backend unit coverage for rating validation and persistence in `src/books/books.service.spec.ts`
- [x] T006 [P] [US1] Add e2e coverage for saving and reloading a book rating in `test/books.e2e-spec.ts`

### Implementation for User Story 1

- [x] T007 [US1] Implement rating selection and save behavior in `frontend/src/app/books/book-detail/book-detail.component.ts`
- [x] T008 [US1] Render the clickable 5-star rating control and current selection in `frontend/src/app/books/book-detail/book-detail.component.html`
- [x] T009 [P] [US1] Add frontend component coverage for rating selection and save behavior in `frontend/src/app/books/book-detail/book-detail.component.spec.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - See Ratings in Lists and Details (Priority: P2)

**Goal**: A reader can see each book’s rating in the books table and on the book details screen without opening any additional views.

**Independent Test**: View a rated book in the books table and details screen and confirm the same star value appears in both places.

### Tests for User Story 2

- [x] T010 [P] [US2] Add frontend display coverage for the books table rating state in `frontend/src/app/books/book-list/book-list.component.spec.ts`
- [x] T011 [P] [US2] Add frontend display coverage for the book details rating state in `frontend/src/app/books/book-detail/book-detail.component.spec.ts`

### Implementation for User Story 2

- [x] T012 [US2] Expose rating-aware table state in `frontend/src/app/books/book-list/book-list.component.ts`
- [x] T013 [US2] Render rating stars and the unrated state in `frontend/src/app/books/book-list/book-list.component.html`
- [x] T014 [US2] Keep the details screen rating display in sync with the shared book value in `frontend/src/app/books/book-detail/book-detail.component.ts` and `frontend/src/app/books/book-detail/book-detail.component.html`

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across backend, frontend, and contract files.

- [x] T015 [P] Verify and fix lint/test/build issues across `openapi.yaml`, `src/books/`, `test/`, and `frontend/src/app/books/`
- [x] T016 [P] Update any implementation notes that changed during delivery in `specs/001-book-rating/quickstart.md` and `specs/001-book-rating/contracts/book-rating-contract.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel if staffing allows
  - Implement in priority order for a single-developer flow
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 and delivers the MVP slice on its own
- **User Story 2 (P2)**: Can start after Phase 2 and reuses the shared rating field and detail screen value

### Within Each User Story

- Tests (if included) should be written before implementation and fail first
- Backend contract and persistence changes must land before UI wiring that depends on them
- Models and shared types before UI rendering
- Core implementation before polish or cleanup

### Parallel Opportunities

- `T001` and `T002` can run in parallel because they touch different contract/model files
- `T003` and `T004` can run in parallel because they touch different backend layers
- `T005` and `T006` can run in parallel because they are separate test suites
- `T009`, `T010`, and `T011` can run in parallel once the corresponding implementation exists
- `T015` and `T016` can run in parallel after story completion

---

## Parallel Example: User Story 1

```bash
Task: "Add backend unit coverage for rating validation and persistence in src/books/books.service.spec.ts"
Task: "Add e2e coverage for saving and reloading a book rating in test/books.e2e-spec.ts"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add frontend display coverage for the books table rating state in frontend/src/app/books/book-list/book-list.component.spec.ts"
Task: "Add frontend display coverage for the book details rating state in frontend/src/app/books/book-detail/book-detail.component.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate the book details rating flow end-to-end

### Incremental Delivery

1. Complete Setup + Foundational
2. Deliver User Story 1 and validate the saved rating flow
3. Deliver User Story 2 to surface the same rating in list and detail views
4. Run final polish tasks and verify the feature in both apps

### Parallel Team Strategy

With multiple developers:

1. One developer owns `T003` and `T004`
2. Another developer can start `T005` and `T006` once the foundation lands
3. A frontend developer can then handle `T007` through `T014` in story order
4. Finish with shared validation in `T015` and `T016`

---

## Notes

- [P] tasks use different files and have no direct dependencies
- [Story] labels map each task to a specific user story for traceability
- Each user story should remain independently testable and demoable
- The MVP scope is User Story 1: save a book rating from the details screen
