import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Book } from '../../models/book.model';
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

  book: Book | null = null;
  loading = false;
  error: string | null = null;

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
