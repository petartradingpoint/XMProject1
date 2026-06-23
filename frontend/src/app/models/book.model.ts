export interface Book {
  id: number;
  title: string;
  authors: string[];
  isbn: string;
  publishedYear: number;
  genre: string | null;
}

export interface BookRequest {
  title: string;
  authors: string[];
  isbn: string;
  publishedYear: number;
  genre?: string;
}

export interface BookQuery {
  genre?: string;
  author?: string;
}
