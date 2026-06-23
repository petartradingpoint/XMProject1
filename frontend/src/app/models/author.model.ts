import { Book } from './book.model';

export interface Author {
  id: number;
  name: string;
  nationality: string | null;
  birthYear: number | null;
  books: Book[];
}

export interface AuthorRequest {
  name: string;
  nationality?: string;
  birthYear?: number;
}
