import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookResponse } from '../books/dto/book-response.dto';
import { Book } from '../books/book.entity';
import { Author } from './author.entity';
import { AuthorRequestDto } from './dto/author-request.dto';
import { AuthorResponse } from './dto/author-response.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorsRepository: Repository<Author>,
  ) {}

  async create(dto: AuthorRequestDto): Promise<AuthorResponse> {
    const author = this.authorsRepository.create({
      name: dto.name,
      nationality: dto.nationality ?? null,
      birthYear: dto.birthYear ?? null,
    });
    const saved = await this.authorsRepository.save(author);
    saved.books = saved.books ?? [];
    return this.toResponse(saved);
  }

  async findAll(): Promise<AuthorResponse[]> {
    const authors = await this.authorsRepository.find({
      relations: ['books', 'books.authors'],
    });
    return authors.map((author) => this.toResponse(author));
  }

  async findOne(id: number): Promise<AuthorResponse> {
    const author = await this.findEntityOrFail(id);
    return this.toResponse(author);
  }

  async findBooks(id: number): Promise<BookResponse[]> {
    const author = await this.findEntityOrFail(id);
    return (author.books ?? []).map((book) => this.mapBook(book));
  }

  /**
   * Resolves an author by exact name, auto-provisioning one when missing so
   * that books can always be linked to an author (spec §1.3).
   */
  async resolveByName(name: string): Promise<Author> {
    const existing = await this.authorsRepository.findOne({ where: { name } });
    if (existing) {
      return existing;
    }
    const created = this.authorsRepository.create({
      name,
      nationality: null,
      birthYear: null,
    });
    return this.authorsRepository.save(created);
  }

  /**
   * Resolves multiple author names to entities, de-duplicating repeated names
   * (case-sensitive) while preserving the submitted order, so a book is never
   * linked to the same author twice (spec §3.4, §3.5).
   */
  async resolveByNames(names: string[]): Promise<Author[]> {
    const uniqueNames = [...new Set(names)];
    const authors: Author[] = [];
    for (const name of uniqueNames) {
      authors.push(await this.resolveByName(name));
    }
    return authors;
  }

  private async findEntityOrFail(id: number): Promise<Author> {
    const author = await this.authorsRepository.findOne({
      where: { id },
      relations: ['books', 'books.authors'],
    });
    if (!author) {
      throw new NotFoundException(`Author with id ${id} not found`);
    }
    return author;
  }

  private toResponse(author: Author): AuthorResponse {
    return {
      id: author.id,
      name: author.name,
      nationality: author.nationality,
      birthYear: author.birthYear,
      books: (author.books ?? []).map((book) => this.mapBook(book)),
    };
  }

  private mapBook(book: Book): BookResponse {
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
