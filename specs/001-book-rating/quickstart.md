# Quickstart: Book Rating

## Goal

Validate that a shared 1-to-5 star rating appears on the books table and the book details screen, and that the value can be updated from the details screen.

## Prerequisites

- Backend dependencies installed
- Frontend dependencies installed
- The repository opened at the project root

## Validation Steps

1. Run the backend tests.
   - Command: `npm test`
   - Expected: existing backend tests pass, including any new rating coverage.

2. Run the backend e2e tests.
   - Command: `npm run test:e2e`
   - Expected: API behavior remains stable and the book responses include the rating field.

3. Run the frontend tests.
   - Command: `cd frontend && npm test`
   - Expected: frontend tests pass, including any rating display coverage.

4. Start the backend and frontend locally.
   - Backend: `npm run start:dev`
   - Frontend: `cd frontend && npm start`
   - Expected: the SPA loads and can reach `/api` through the proxy.

5. Verify the books table.
   - Open the books list.
   - Expected: rated books show 1 to 5 stars; unrated books show an unrated state.

6. Verify the book details screen.
   - Open a book details page.
   - Expected: the same rating appears as stars.

7. Change a rating.
   - Select a new star value on the details screen.
   - Expected: the updated value is saved through the shared book update flow and shown again on both the table and details screen after refresh.

## References

- Data model: [data-model.md](data-model.md)
- Contract: [contracts/book-rating-contract.md](contracts/book-rating-contract.md)
