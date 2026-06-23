import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Author } from '../../models/author.model';
import { AuthorService } from '../../services/author.service';
import { extractErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-author-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './author-detail.component.html',
})
export class AuthorDetailComponent implements OnInit {
  private readonly authorService = inject(AuthorService);
  private readonly route = inject(ActivatedRoute);

  author: Author | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.authorService.get(id).subscribe({
      next: (author) => {
        this.author = author;
        this.loading = false;
      },
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to load author.');
        this.loading = false;
      },
    });
  }
}
