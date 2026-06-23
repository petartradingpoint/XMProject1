import { BookResponse } from '../../books/dto/book-response.dto';

export interface AuthorResponse {
  readonly id: number;
  readonly name: string;
  readonly nationality: string | null;
  readonly birthYear: number | null;
  readonly books: BookResponse[];
}
