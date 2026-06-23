import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'books' },
  {
    path: 'books',
    loadComponent: () =>
      import('./books/book-list/book-list.component').then(
        (m) => m.BookListComponent,
      ),
  },
  {
    path: 'books/new',
    loadComponent: () =>
      import('./books/book-form/book-form.component').then(
        (m) => m.BookFormComponent,
      ),
  },
  {
    path: 'books/:id',
    loadComponent: () =>
      import('./books/book-detail/book-detail.component').then(
        (m) => m.BookDetailComponent,
      ),
  },
  {
    path: 'books/:id/edit',
    loadComponent: () =>
      import('./books/book-form/book-form.component').then(
        (m) => m.BookFormComponent,
      ),
  },
  {
    path: 'authors',
    loadComponent: () =>
      import('./authors/author-list/author-list.component').then(
        (m) => m.AuthorListComponent,
      ),
  },
  {
    path: 'authors/new',
    loadComponent: () =>
      import('./authors/author-form/author-form.component').then(
        (m) => m.AuthorFormComponent,
      ),
  },
  {
    path: 'authors/:id',
    loadComponent: () =>
      import('./authors/author-detail/author-detail.component').then(
        (m) => m.AuthorDetailComponent,
      ),
  },
  { path: '**', redirectTo: 'books' },
];
