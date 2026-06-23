# Data Model: Book Rating

## Entity: Book

### Fields
- `id`: number, primary key
- `title`: string, required
- `isbn`: string, required, unique
- `publishedYear`: number, required
- `genre`: string | null, optional
- `rating`: number | null, optional, integer 1 through 5 when present
- `authors`: Author[], existing many-to-many relationship

### Rules
- `rating` is shared by all users for the same book.
- `rating` may be `null` to represent an unrated book.
- `rating` must be an integer in the inclusive range 1 to 5 when set.
- Changing `rating` updates the same book record; it does not create a separate rating entity.

## State Transitions

- `null` -> `1..5`: a user rates an unrated book.
- `1..5` -> `1..5`: a user updates an existing rating.
- `1..5` -> `null`: not part of the initial feature scope.

## Validation and Display Notes

- The backend must reject non-integer or out-of-range values.
- The frontend must render `null` as an unrated state rather than as `0` or blank text.
- The books table and book details screen should both read from the same `Book.rating` value.
