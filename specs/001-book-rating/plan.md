# Implementation Plan: Book Rating

**Branch**: `[001-book-rating]` | **Date**: 2026-06-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-book-rating/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a shared 1-to-5 star rating to books so the rating is visible in the books table and on the book details screen. The implementation will extend the existing `Book` domain model and OpenAPI contract with a nullable integer `rating` field, then surface that field through the backend responses and Angular views without introducing a separate ratings subsystem.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.7 backend / TypeScript 5.4 frontend

**Primary Dependencies**: NestJS 11, TypeORM 0.3, class-validator, Angular 17

**Storage**: In-memory SQLite via TypeORM, persisted only for the running process

**Testing**: Jest for backend unit/e2e, Karma/Jasmine for frontend, plus manual UI verification

**Target Platform**: Local web application on Node.js with Angular SPA

**Project Type**: Web application

**Performance Goals**: Rating display and update should remain instantaneous in normal local usage; no new heavy queries or joins beyond the existing book loads

**Constraints**: Keep the OpenAPI contract, DTO validation, entity mapping, and Angular models aligned; preserve the existing in-memory database behavior

**Scale/Scope**: Single book library domain with existing books and authors screens; feature touches list and detail views only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Contract first: PASS. The feature will update the OpenAPI schemas together with backend DTOs and frontend models.
- Strict validation at the edge: PASS. The rating field will be validated as an integer in the allowed range.
- Typed and lint-clean: PASS. The change stays within the existing TypeScript/NestJS/Angular toolchain and avoids `any`.
- Module boundaries: PASS. Backend changes remain in `books/` and frontend changes remain in `frontend/src/app/books/` and shared models.
- Persistence explicit: PASS. The rating is a deliberate schema change on the `Book` entity and does not introduce a new persistence layer.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
src/
├── app.module.ts
├── main.ts
├── authors/
│   ├── author.entity.ts
│   ├── authors.controller.ts
│   ├── authors.service.ts
│   └── dto/
├── books/
│   ├── book.entity.ts
│   ├── books.controller.ts
│   ├── books.service.ts
│   └── dto/
└── common/
    └── filters/

test/
├── authors.e2e-spec.ts
└── books.e2e-spec.ts

frontend/
└── src/app/
    ├── authors/
    ├── books/
    ├── models/
    ├── services/
    └── shared/
```

**Structure Decision**: Use the existing web application layout: backend feature code in `src/books/` and `src/common/`, frontend feature code in `frontend/src/app/books/`, and shared data contracts in `frontend/src/app/models/`. The rating feature does not require a new top-level service or package.

## Complexity Tracking

No constitution violations require justification.
