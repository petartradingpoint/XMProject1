import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Author } from './author.entity';
import { AuthorsService } from './authors.service';

type MockRepository = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
};

const createMockRepository = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('AuthorsService', () => {
  let service: AuthorsService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: getRepositoryToken(Author),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    repository = module.get<MockRepository>(getRepositoryToken(Author));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates an author and maps it to the response shape', async () => {
      const dto = {
        name: 'George Orwell',
        nationality: 'British',
        birthYear: 1903,
      };
      const entity = { id: 1, ...dto, books: undefined } as unknown as Author;
      repository.create.mockReturnValue(entity);
      repository.save.mockResolvedValue({ ...entity });

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        name: 'George Orwell',
        nationality: 'British',
        birthYear: 1903,
      });
      expect(result).toEqual({
        id: 1,
        name: 'George Orwell',
        nationality: 'British',
        birthYear: 1903,
        books: [],
      });
    });

    it('defaults optional fields to null', async () => {
      const dto = { name: 'Anon' };
      const entity = {
        id: 2,
        name: 'Anon',
        nationality: null,
        birthYear: null,
        books: [],
      } as unknown as Author;
      repository.create.mockReturnValue(entity);
      repository.save.mockResolvedValue(entity);

      await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Anon',
        nationality: null,
        birthYear: null,
      });
    });
  });

  describe('findAll', () => {
    it('returns all authors with nested books carrying their own author list', async () => {
      const authors = [
        {
          id: 1,
          name: 'George Orwell',
          nationality: 'British',
          birthYear: 1903,
          books: [
            {
              id: 10,
              title: 'Good Omens',
              isbn: 'isbn-1',
              publishedYear: 1990,
              genre: 'Fantasy',
              authors: [
                { id: 1, name: 'George Orwell' },
                { id: 2, name: 'Aldous Huxley' },
              ],
            },
          ],
        },
      ];
      repository.find.mockResolvedValue(authors);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['books', 'books.authors'],
      });
      expect(result).toEqual([
        {
          id: 1,
          name: 'George Orwell',
          nationality: 'British',
          birthYear: 1903,
          books: [
            {
              id: 10,
              title: 'Good Omens',
              authors: ['George Orwell', 'Aldous Huxley'],
              isbn: 'isbn-1',
              publishedYear: 1990,
              genre: 'Fantasy',
            },
          ],
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('returns a single author by id', async () => {
      repository.findOne.mockResolvedValue({
        id: 1,
        name: 'George Orwell',
        nationality: 'British',
        birthYear: 1903,
        books: [],
      });

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['books', 'books.authors'],
      });
      expect(result).toEqual({
        id: 1,
        name: 'George Orwell',
        nationality: 'British',
        birthYear: 1903,
        books: [],
      });
    });

    it('throws NotFoundException when the author is missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findBooks', () => {
    it('returns the books for an author, each with its full author list', async () => {
      repository.findOne.mockResolvedValue({
        id: 1,
        name: 'George Orwell',
        nationality: 'British',
        birthYear: 1903,
        books: [
          {
            id: 10,
            title: 'Good Omens',
            isbn: 'isbn-1',
            publishedYear: 1990,
            genre: 'Fantasy',
            authors: [
              { id: 1, name: 'George Orwell' },
              { id: 2, name: 'Aldous Huxley' },
            ],
          },
        ],
      });

      const result = await service.findBooks(1);

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

    it('throws NotFoundException when the author is missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findBooks(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('resolveByName', () => {
    it('returns the existing author when one matches', async () => {
      const existing = { id: 1, name: 'George Orwell' } as Author;
      repository.findOne.mockResolvedValue(existing);

      const result = await service.resolveByName('George Orwell');

      expect(result).toBe(existing);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('auto-provisions a new author when none matches', async () => {
      repository.findOne.mockResolvedValue(null);
      const created = { id: 5, name: 'New Author' } as Author;
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.resolveByName('New Author');

      expect(repository.create).toHaveBeenCalledWith({
        name: 'New Author',
        nationality: null,
        birthYear: null,
      });
      expect(result).toBe(created);
    });
  });

  describe('resolveByNames', () => {
    it('resolves multiple names, preserving order', async () => {
      const orwell = { id: 1, name: 'George Orwell' } as Author;
      const huxley = { id: 2, name: 'Aldous Huxley' } as Author;
      repository.findOne
        .mockResolvedValueOnce(orwell)
        .mockResolvedValueOnce(huxley);

      const result = await service.resolveByNames([
        'George Orwell',
        'Aldous Huxley',
      ]);

      expect(result).toEqual([orwell, huxley]);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('de-duplicates repeated names so an author is linked once', async () => {
      const orwell = { id: 1, name: 'George Orwell' } as Author;
      repository.findOne.mockResolvedValue(orwell);

      const result = await service.resolveByNames([
        'George Orwell',
        'George Orwell',
      ]);

      expect(result).toEqual([orwell]);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });

    it('auto-provisions only the missing authors', async () => {
      const existing = { id: 1, name: 'George Orwell' } as Author;
      const created = { id: 7, name: 'Neil Gaiman' } as Author;
      repository.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(null);
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.resolveByNames([
        'George Orwell',
        'Neil Gaiman',
      ]);

      expect(result).toEqual([existing, created]);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Neil Gaiman',
        nationality: null,
        birthYear: null,
      });
    });
  });
});
