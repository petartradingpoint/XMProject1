import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthorsService } from '../authors/authors.service';
import { Author } from '../authors/author.entity';
import { Book } from './book.entity';
import { BooksService } from './books.service';

type MockRepository = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  delete: jest.Mock;
};

const createMockRepository = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('BooksService', () => {
  let service: BooksService;
  let repository: MockRepository;
  let authorsService: jest.Mocked<Pick<AuthorsService, 'resolveByNames'>>;

  const orwell = { id: 1, name: 'George Orwell' } as Author;
  const huxley = { id: 2, name: 'Aldous Huxley' } as Author;

  beforeEach(async () => {
    authorsService = { resolveByNames: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: createMockRepository(),
        },
        { provide: AuthorsService, useValue: authorsService },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<MockRepository>(getRepositoryToken(Book));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all books with their authors and no filters', async () => {
      repository.find.mockResolvedValue([
        {
          id: 10,
          title: 'Good Omens',
          isbn: 'isbn-1',
          publishedYear: 1990,
          genre: 'Fantasy',
          authors: [orwell, huxley],
        },
      ]);

      const result = await service.findAll({});

      expect(repository.find).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual([
        {
          id: 10,
          title: 'Good Omens',
          authors: ['George Orwell', 'Aldous Huxley'],
          isbn: 'isbn-1',
          publishedYear: 1990,
          genre: 'Fantasy',
        },
      ]);
    });

    it('filters by genre at the repository level', async () => {
      repository.find.mockResolvedValue([]);

      await service.findAll({ genre: 'Dystopian' });

      expect(repository.find).toHaveBeenCalledWith({
        where: { genre: 'Dystopian' },
      });
    });

    it('filters by author name, keeping the full author list of matches', async () => {
      repository.find.mockResolvedValue([
        {
          id: 10,
          title: 'Good Omens',
          isbn: 'isbn-1',
          publishedYear: 1990,
          genre: 'Fantasy',
          authors: [orwell, huxley],
        },
        {
          id: 11,
          title: 'Brave New World',
          isbn: 'isbn-2',
          publishedYear: 1932,
          genre: 'Dystopian',
          authors: [huxley],
        },
      ]);

      const result = await service.findAll({ author: 'George Orwell' });

      // The author filter is applied in-memory, so genre is the only
      // criterion forwarded to the repository.
      expect(repository.find).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual([
        {
          id: 10,
          title: 'Good Omens',
          authors: ['George Orwell', 'Aldous Huxley'],
          isbn: 'isbn-1',
          publishedYear: 1990,
          genre: 'Fantasy',
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('returns a single book with its authors', async () => {
      repository.findOne.mockResolvedValue({
        id: 10,
        title: 'Good Omens',
        isbn: 'isbn-1',
        publishedYear: 1990,
        genre: 'Fantasy',
        authors: [orwell, huxley],
      });

      const result = await service.findOne(10);

      expect(result).toEqual({
        id: 10,
        title: 'Good Omens',
        authors: ['George Orwell', 'Aldous Huxley'],
        isbn: 'isbn-1',
        publishedYear: 1990,
        genre: 'Fantasy',
      });
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      title: 'Good Omens',
      authors: ['George Orwell', 'Aldous Huxley'],
      isbn: 'isbn-1',
      publishedYear: 1990,
      genre: 'Fantasy',
    };

    it('creates a book, resolving every author by name', async () => {
      repository.findOne.mockResolvedValue(null); // ISBN available
      authorsService.resolveByNames.mockResolvedValue([orwell, huxley]);
      const entity = {
        id: 10,
        title: 'Good Omens',
        isbn: 'isbn-1',
        publishedYear: 1990,
        genre: 'Fantasy',
        authors: [orwell, huxley],
      };
      repository.create.mockReturnValue(entity);
      repository.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(authorsService.resolveByNames).toHaveBeenCalledWith([
        'George Orwell',
        'Aldous Huxley',
      ]);
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Good Omens',
        isbn: 'isbn-1',
        publishedYear: 1990,
        genre: 'Fantasy',
        authors: [orwell, huxley],
      });
      expect(result).toEqual({
        id: 10,
        title: 'Good Omens',
        authors: ['George Orwell', 'Aldous Huxley'],
        isbn: 'isbn-1',
        publishedYear: 1990,
        genre: 'Fantasy',
      });
    });

    it('throws ConflictException on duplicate ISBN', async () => {
      repository.findOne.mockResolvedValue({ id: 99, isbn: 'isbn-1' });

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(authorsService.resolveByNames).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('defaults genre to null when omitted', async () => {
      repository.findOne.mockResolvedValue(null);
      authorsService.resolveByNames.mockResolvedValue([orwell]);
      repository.create.mockReturnValue({});
      repository.save.mockResolvedValue({
        id: 11,
        title: 'Animal Farm',
        isbn: 'isbn-2',
        publishedYear: 1945,
        genre: null,
        authors: [orwell],
      });

      await service.create({
        title: 'Animal Farm',
        authors: ['George Orwell'],
        isbn: 'isbn-2',
        publishedYear: 1945,
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ genre: null }),
      );
    });
  });

  describe('update', () => {
    const existing = {
      id: 10,
      title: 'Good Omens',
      isbn: 'isbn-1',
      publishedYear: 1990,
      genre: 'Fantasy',
      authors: [orwell],
    };

    it('replaces the book authors wholesale', async () => {
      repository.findOne.mockResolvedValueOnce({ ...existing });
      authorsService.resolveByNames.mockResolvedValue([orwell, huxley]);
      repository.save.mockImplementation((b: Book) => Promise.resolve(b));

      const result = await service.update(10, {
        title: 'Good Omens (Revised)',
        authors: ['George Orwell', 'Aldous Huxley'],
        isbn: 'isbn-1',
        publishedYear: 1991,
        genre: 'Classic',
      });

      expect(authorsService.resolveByNames).toHaveBeenCalledWith([
        'George Orwell',
        'Aldous Huxley',
      ]);
      expect(result).toEqual({
        id: 10,
        title: 'Good Omens (Revised)',
        authors: ['George Orwell', 'Aldous Huxley'],
        isbn: 'isbn-1',
        publishedYear: 1991,
        genre: 'Classic',
      });
    });

    it('throws NotFoundException when the book is missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, {
          title: 'x',
          authors: ['y'],
          isbn: 'z',
          publishedYear: 2000,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when the new ISBN belongs to another book', async () => {
      repository.findOne
        .mockResolvedValueOnce({ ...existing }) // findEntityOrFail
        .mockResolvedValueOnce({ id: 20, isbn: 'isbn-9' }); // ISBN check

      await expect(
        service.update(10, {
          title: 'Good Omens',
          authors: ['George Orwell'],
          isbn: 'isbn-9',
          publishedYear: 1990,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not run an ISBN check when the ISBN is unchanged', async () => {
      repository.findOne.mockResolvedValueOnce({ ...existing });
      authorsService.resolveByNames.mockResolvedValue([orwell]);
      repository.save.mockImplementation((b: Book) => Promise.resolve(b));

      await service.update(10, {
        title: 'Good Omens',
        authors: ['George Orwell'],
        isbn: 'isbn-1',
        publishedYear: 1990,
      });

      // Only the initial findEntityOrFail lookup happened (no ISBN lookup).
      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('deletes an existing book', async () => {
      repository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(10)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith(10);
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
