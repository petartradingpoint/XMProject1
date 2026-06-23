import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AuthorsService } from '../authors/authors.service';
import { Book } from './book.entity';
import { BookQueryDto } from './dto/book-query.dto';
import { BookRequestDto } from './dto/book-request.dto';
import { BookResponse } from './dto/book-response.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    private readonly authorsService: AuthorsService,
  ) {}

  async findAll(query: BookQueryDto): Promise<BookResponse[]> {
    const where: FindOptionsWhere<Book> = {};
    if (query.genre !== undefined) {
      where.genre = query.genre;
    }

    const books = await this.booksRepository.find({ where });
    const filtered =
      query.author !== undefined
        ? books.filter((book) =>
            (book.authors ?? []).some((author) => author.name === query.author),
          )
        : books;
    return filtered.map((book) => this.toResponse(book));
  }

  async findOne(id: number): Promise<BookResponse> {
    const book = await this.findEntityOrFail(id);
    return this.toResponse(book);
  }

  async create(dto: BookRequestDto): Promise<BookResponse> {
    await this.assertIsbnAvailable(dto.isbn);
    const authors = await this.authorsService.resolveByNames(dto.authors);

    const book = this.booksRepository.create({
      title: dto.title,
      isbn: dto.isbn,
      publishedYear: dto.publishedYear,
      genre: dto.genre ?? null,
      authors,
    });
    const saved = await this.booksRepository.save(book);
    return this.toResponse(saved);
  }

  async update(id: number, dto: BookRequestDto): Promise<BookResponse> {
    const book = await this.findEntityOrFail(id);

    if (dto.isbn !== book.isbn) {
      await this.assertIsbnAvailable(dto.isbn);
    }

    const authors = await this.authorsService.resolveByNames(dto.authors);

    book.title = dto.title;
    book.isbn = dto.isbn;
    book.publishedYear = dto.publishedYear;
    book.genre = dto.genre ?? null;
    book.authors = authors;

    const saved = await this.booksRepository.save(book);
    return this.toResponse(saved);
  }

  async remove(id: number): Promise<void> {
    const result = await this.booksRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }
  }

  private async assertIsbnAvailable(isbn: string): Promise<void> {
    const existing = await this.booksRepository.findOne({ where: { isbn } });
    if (existing) {
      throw new ConflictException(`Book with isbn ${isbn} already exists`);
    }
  }

  private async findEntityOrFail(id: number): Promise<Book> {
    const book = await this.booksRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }
    return book;
  }

  private toResponse(book: Book): BookResponse {
    return {
      id: book.id,
      title: book.title,
      authors: (book.authors ?? []).map((author) => author.name),
      isbn: book.isbn,
      publishedYear: book.publishedYear,
      genre: book.genre,
    };
  }
}
