import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookRequest } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { extractErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './book-form.component.html',
})
export class BookFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookService = inject(BookService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly currentYear = new Date().getFullYear();

  id: number | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    authors: this.fb.nonNullable.array<FormControl<string>>(
      [this.createAuthorControl()],
      [Validators.required],
    ),
    isbn: ['', [Validators.required, Validators.maxLength(255)]],
    publishedYear: [
      this.currentYear,
      [Validators.required, Validators.min(0), Validators.max(this.currentYear + 1)],
    ],
    genre: ['', [Validators.maxLength(100)]],
  });

  get authors(): FormArray<FormControl<string>> {
    return this.form.controls.authors;
  }

  private createAuthorControl(value = ''): FormControl<string> {
    return this.fb.nonNullable.control(value, [
      Validators.required,
      Validators.maxLength(255),
    ]);
  }

  addAuthor(): void {
    this.authors.push(this.createAuthorControl());
  }

  removeAuthor(index: number): void {
    if (this.authors.length > 1) {
      this.authors.removeAt(index);
    }
  }

  get isEdit(): boolean {
    return this.id !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.loadBook(this.id);
    }
  }

  private loadBook(id: number): void {
    this.loading = true;
    this.bookService.get(id).subscribe({
      next: (book) => {
        this.authors.clear();
        (book.authors.length ? book.authors : ['']).forEach((name) =>
          this.authors.push(this.createAuthorControl(name)),
        );
        this.form.patchValue({
          title: book.title,
          isbn: book.isbn,
          publishedYear: book.publishedYear,
          genre: book.genre ?? '',
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to load book.');
        this.loading = false;
      },
    });
  }

  submit(): void {
    const raw = this.form.getRawValue();
    const authors = raw.authors
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (this.form.invalid || authors.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: BookRequest = {
      title: raw.title.trim(),
      authors,
      isbn: raw.isbn.trim(),
      publishedYear: raw.publishedYear,
      genre: raw.genre.trim() || undefined,
    };

    this.saving = true;
    this.error = null;
    const request$ =
      this.isEdit && this.id !== null
        ? this.bookService.update(this.id, payload)
        : this.bookService.create(payload);

    request$.subscribe({
      next: (book) => {
        this.saving = false;
        this.router.navigate(['/books', book.id]);
      },
      error: (err) => {
        this.error = extractErrorMessage(err, 'Failed to save book.');
        this.saving = false;
      },
    });
  }

  cancel(): void {
    if (this.isEdit && this.id !== null) {
      this.router.navigate(['/books', this.id]);
    } else {
      this.router.navigate(['/books']);
    }
  }
}
