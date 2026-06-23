import { RouterTestingModule } from '@angular/router/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Book } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { BookDetailComponent } from './book-detail.component';

describe('BookDetailComponent', () => {
  let fixture: ComponentFixture<BookDetailComponent>;
  let bookService: jasmine.SpyObj<BookService>;

  const book: Book = {
    id: 1,
    title: 'Dune',
    authors: ['Frank Herbert'],
    isbn: 'isbn-1',
    publishedYear: 1965,
    genre: 'Sci-Fi',
    rating: 4,
  };

  beforeEach(async () => {
    bookService = jasmine.createSpyObj<BookService>('BookService', [
      'get',
      'update',
      'delete',
    ]);
    bookService.get.and.returnValue(of(book));
    bookService.update.and.returnValue(of({ ...book, rating: 5 }));
    bookService.delete.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, BookDetailComponent],
      providers: [
        { provide: BookService, useValue: bookService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookDetailComponent);
  });

  it('renders the current rating as stars', () => {
    fixture.detectChanges();

    const stars = Array.from(
      fixture.nativeElement.querySelectorAll('button[aria-label^="Rate "]'),
    ) as HTMLButtonElement[];

    expect(stars.length).toBe(5);
    expect(stars.map((star) => star.textContent?.trim())).toEqual([
      '★',
      '★',
      '★',
      '★',
      '☆',
    ]);
    expect(fixture.nativeElement.textContent).toContain('4/5 stars');
  });

  it('saves a new rating when a star is clicked', () => {
    fixture.detectChanges();

    const stars = fixture.nativeElement.querySelectorAll(
      'button[aria-label^="Rate "]',
    ) as NodeListOf<HTMLButtonElement>;
    stars[4].click();
    fixture.detectChanges();

    expect(bookService.update).toHaveBeenCalledWith(1, {
      title: 'Dune',
      authors: ['Frank Herbert'],
      isbn: 'isbn-1',
      publishedYear: 1965,
      genre: 'Sci-Fi',
      rating: 5,
    });
    expect(fixture.nativeElement.textContent).toContain('5/5 stars');
  });
});
