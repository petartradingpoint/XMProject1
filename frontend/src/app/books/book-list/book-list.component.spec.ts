import { RouterTestingModule } from '@angular/router/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Book } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { BookListComponent } from './book-list.component';

describe('BookListComponent', () => {
  let fixture: ComponentFixture<BookListComponent>;
  let bookService: jasmine.SpyObj<BookService>;

  const books: Book[] = [
    {
      id: 1,
      title: 'Dune',
      authors: ['Frank Herbert'],
      isbn: 'isbn-1',
      publishedYear: 1965,
      genre: 'Sci-Fi',
      rating: 4,
    },
    {
      id: 2,
      title: 'Untitled',
      authors: ['Someone'],
      isbn: 'isbn-2',
      publishedYear: 2000,
      genre: null,
      rating: null,
    },
  ];

  beforeEach(async () => {
    bookService = jasmine.createSpyObj<BookService>('BookService', [
      'list',
      'delete',
    ]);
    bookService.list.and.returnValue(of(books));
    bookService.delete.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, BookListComponent],
      providers: [{ provide: BookService, useValue: bookService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BookListComponent);
  });

  it('renders rating stars in the table and shows unrated books', () => {
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('★★★★☆');
    expect(rows[1].textContent).toContain('☆☆☆☆☆');
    expect(rows[1].textContent).toContain('Unrated');
  });
});
