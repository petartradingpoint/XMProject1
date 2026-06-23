# Contract: Book Rating

## Scope

This feature extends the existing book contract. No new resource is introduced.

## API Contract

### Book representation

- `rating`: integer | null
- Allowed values: `1`, `2`, `3`, `4`, `5`
- Unrated books use `null`

### Book write payloads

- Book create/update payloads accept `rating` as an optional field.
- When present, `rating` must be an integer from 1 to 5.
- When omitted, the existing rating remains unchanged on update or remains unrated on create.

## UI Contract

- Books table: show the current rating as stars.
- Book details screen: show the current rating as stars and allow the user to change it.
- Unrated books: show an unrated state on both screens.
- Ratings are saved on the shared book record; if a book update omits `rating`, the existing value stays in place.

## Contract Notes

- The shared rating belongs to the book, not to a specific user.
- The contract does not add a separate rating endpoint in v1.
