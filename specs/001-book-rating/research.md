# Research: Book Rating

## 1. Rating storage model

- Decision: Store the rating as a nullable integer field on `Book`.
- Rationale: The feature is a single shared rating per book, so a separate rating entity would add complexity without a new domain boundary.
- Alternatives considered: Separate `BookRating` entity; per-user ratings; rating history table. Rejected because the spec calls for one shared rating visible to everyone.

## 2. API contract shape

- Decision: Extend the existing book contract to include `rating` in book representations and book write payloads.
- Rationale: The existing API already centers on book CRUD, and the feature only adds one field rather than a new resource.
- Alternatives considered: New `/books/{id}/rating` endpoint. Rejected because the current product has no established partial-update pattern and the field fits the book resource.

## 3. Validation rules

- Decision: Accept only integer ratings from 1 through 5, with `null` meaning unrated.
- Rationale: Matches the product requirement of 5 stars and gives the UI a clear unrated state.
- Alternatives considered: Half-stars, zero as unrated, free-form numeric ranges. Rejected because they would blur the stated star model.

## 4. Frontend rendering

- Decision: Show the rating as stars in both the books table and the book details screen.
- Rationale: The feature request explicitly requires both surfaces to display the rating.
- Alternatives considered: Numeric display only; detail-only display. Rejected because they do not satisfy the visibility requirement.

## 5. Testing strategy

- Decision: Cover the change with backend unit tests and e2e tests, plus frontend component/service checks where the UI renders or edits the rating.
- Rationale: The feature touches data validation, persistence, and presentation in two apps.
- Alternatives considered: Manual testing only. Rejected because it would not protect the contract or rendering paths.
