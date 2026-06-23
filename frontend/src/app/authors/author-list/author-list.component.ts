import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Author } from '../../models/author.model';
import { AuthorService } from '../../services/author.service';
import { extractErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './author-list.component.html',
})
export class AuthorListComponent implements OnInit {
  private readonly authorService = inject(AuthorService);

  authors: Author[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.authorService.list().subscribe({
      next: (authors) => {
        this.authors = authors;
        this.loading = false;
      },
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to load authors.');
        this.loading = false;
      },
    });
  }
}
