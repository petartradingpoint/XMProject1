export interface BookResponse {
  readonly id: number;
  readonly title: string;
  readonly authors: string[];
  readonly isbn: string;
  readonly publishedYear: number;
  readonly genre: string | null;
  readonly rating: number | null;
}
