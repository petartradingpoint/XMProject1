import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthorRequest } from '../../models/author.model';
import { AuthorService } from '../../services/author.service';
import { extractErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-author-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './author-form.component.html',
})
export class AuthorFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authorService = inject(AuthorService);
  private readonly router = inject(Router);

  private readonly currentYear = new Date().getFullYear();

  saving = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    nationality: ['', [Validators.maxLength(100)]],
    birthYear: this.fb.control<number | null>(null, [
      Validators.min(0),
      Validators.max(this.currentYear),
    ]),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: AuthorRequest = {
      name: raw.name.trim(),
      nationality: raw.nationality.trim() || undefined,
      birthYear: raw.birthYear ?? undefined,
    };

    this.saving = true;
    this.error = null;
    this.authorService.create(payload).subscribe({
      next: (author) => {
        this.saving = false;
        this.router.navigate(['/authors', author.id]);
      },
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to create author.');
        this.saving = false;
      },
    });
  }
}
