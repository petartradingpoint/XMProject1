import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Author, AuthorRequest } from '../models/author.model';
import { Book } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/authors';

  list(): Observable<Author[]> {
    return this.http.get<Author[]>(this.baseUrl);
  }

  get(id: number): Observable<Author> {
    return this.http.get<Author>(`${this.baseUrl}/${id}`);
  }

  getBooks(id: number): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.baseUrl}/${id}/books`);
  }

  create(body: AuthorRequest): Observable<Author> {
    return this.http.post<Author>(this.baseUrl, body);
  }
}
