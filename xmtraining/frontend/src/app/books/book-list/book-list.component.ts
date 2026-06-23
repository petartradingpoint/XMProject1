import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Book } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { extractErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './book-list.component.html',
})
export class BookListComponent implements OnInit {
  private readonly bookService = inject(BookService);

  books: Book[] = [];
  loading = false;
  error: string | null = null;

  genreFilter = '';
  authorFilter = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.bookService
      .list({
        genre: this.genreFilter.trim() || undefined,
        author: this.authorFilter.trim() || undefined,
      })
      .subscribe({
        next: (books) => {
          this.books = books;
          this.loading = false;
        },
        error: (err) => {
          this.error = extractErrorMessage(err, 'Failed to load books.');
          this.loading = false;
        },
      });
  }

  clearFilters(): void {
    this.genreFilter = '';
    this.authorFilter = '';
    this.load();
  }

  delete(book: Book): void {
    if (!confirm(`Delete "${book.title}"?`)) {
      return;
    }
    this.bookService.delete(book.id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to delete book.');
      },
    });
  }
}
