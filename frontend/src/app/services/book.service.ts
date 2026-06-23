import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Book, BookQuery, BookRequest } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/books';

  list(query: BookQuery = {}): Observable<Book[]> {
    let params = new HttpParams();
    if (query.genre) {
      params = params.set('genre', query.genre);
    }
    if (query.author) {
      params = params.set('author', query.author);
    }
    return this.http.get<Book[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/${id}`);
  }

  create(body: BookRequest): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, body);
  }

  update(id: number, body: BookRequest): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
