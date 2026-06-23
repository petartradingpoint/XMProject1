import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Book, BookRequest } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { extractErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-detail.component.html',
})
export class BookDetailComponent implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly starValues = [1, 2, 3, 4, 5];

  book: Book | null = null;
  loading = false;
  error: string | null = null;
  savingRating = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.bookService.get(id).subscribe({
      next: (book) => {
        this.book = book;
        this.loading = false;
      },
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to load book.');
        this.loading = false;
      },
    });
  }

  rate(star: number): void {
    if (!this.book || this.savingRating) {
      return;
    }

    const payload: BookRequest = {
      title: this.book.title,
      authors: [...this.book.authors],
      isbn: this.book.isbn,
      publishedYear: this.book.publishedYear,
      genre: this.book.genre ?? undefined,
      rating: star,
    };

    this.savingRating = true;
    this.error = null;
    this.bookService.update(this.book.id, payload).subscribe({
      next: (book) => {
        this.book = book;
        this.savingRating = false;
      },
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to save rating.');
        this.savingRating = false;
      },
    });
  }

  delete(): void {
    if (!this.book || !confirm(`Delete "${this.book.title}"?`)) {
      return;
    }
    this.bookService.delete(this.book.id).subscribe({
      next: () => this.router.navigate(['/books']),
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to delete book.');
      },
    });
  }
}
