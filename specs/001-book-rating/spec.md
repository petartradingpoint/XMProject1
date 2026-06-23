# Feature Specification: Book Rating

**Feature Branch**: `[001-book-rating]`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "Ability to add book rating from the user, using 5 stars that would be visible on the table and on the book details screen."

## Clarifications

### Session 2026-06-23

- Q: Should ratings be personal or shared? → A: One shared rating per book, editable by any user.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rate a Book from Details (Priority: P1)

A reader can open a book’s details screen, choose a rating from 1 to 5 stars, and have that rating saved for the book.

**Why this priority**: Setting a rating is the core value of the feature and is the first action users expect to complete.

**Independent Test**: Open a book details screen, select a star rating, and confirm the chosen rating is retained when the book is viewed again.

**Acceptance Scenarios**:

1. **Given** a book with no rating, **When** the user selects 4 stars on the details screen, **Then** the book is shown as rated 4 stars.
2. **Given** a book with an existing rating, **When** the user changes the rating to 2 stars, **Then** the updated rating replaces the previous one.

---

### User Story 2 - See Ratings in Lists and Details (Priority: P2)

A reader can see each book’s rating in the books table and on the book details screen without opening any additional views.

**Why this priority**: Visibility makes ratings useful during browsing and helps users compare books quickly.

**Independent Test**: View a rated book in the books table and in the details screen and confirm the same star value is shown in both places.

**Acceptance Scenarios**:

1. **Given** a book with a saved rating, **When** the books table is displayed, **Then** the rating is visible as stars for that book.
2. **Given** a book with a saved rating, **When** the details screen is displayed, **Then** the same rating is visible as stars on the book details screen.

### Edge Cases

- A book with no rating should display an unrated state rather than a misleading number.
- Ratings outside the 1 to 5 star range should not be accepted.
- If a user changes their mind, the latest selected rating should replace the previous one.
- A partially selected or interrupted rating action should not leave the book in an invalid state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to assign a rating from 1 to 5 stars to a book.
- **FR-002**: The rating control MUST be available on the book details screen.
- **FR-003**: The selected rating MUST be visible in the books table.
- **FR-004**: The selected rating MUST be visible on the book details screen.
- **FR-005**: A saved rating MUST remain attached to the same book when the user revisits it.
- **FR-006**: The system MUST prevent ratings outside the 1 to 5 range.
- **FR-007**: Books with no rating MUST be shown in a distinct unrated state.

### Key Entities *(include if feature involves data)*

- **Book**: A library item that can carry a single shared visible star rating.
- **Book Rating**: The selected score from 1 to 5 stars stored for a book and visible to all users.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of users can assign a rating within 10 seconds of opening a book details screen.
- **SC-002**: 100% of rated books show the same star value in the books table and the details screen.
- **SC-003**: 100% of attempts to choose a value outside the 1 to 5 range are prevented.
- **SC-004**: At least 95% of users can identify whether a book is rated or unrated at a glance.

## Assumptions

- Each book has one visible rating value rather than separate ratings from multiple users.
- The rating is shared across all users rather than personalized per user account.
- The rating is a simple 1 to 5 star scale with no half-stars.
- The existing books table and details screen are the places where the rating must appear.
- A user can update a previously saved rating by selecting a new star value.
