export interface Book {
  id: number;
  title: string;
  authors: string[];
  isbn: string;
  publishedYear: number;
  genre: string | null;
  rating: number | null;
}

export interface BookRequest {
  title: string;
  authors: string[];
  isbn: string;
  publishedYear: number;
  genre?: string;
  rating?: number | null;
}

export interface BookQuery {
  genre?: string;
  author?: string;
}
