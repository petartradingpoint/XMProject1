import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BookResponse } from './dto/book-response.dto';

describe('BooksController', () => {
  let controller: BooksController;
  let service: jest.Mocked<
    Pick<BooksService, 'findAll' | 'findOne' | 'create' | 'update' | 'remove'>
  >;

  const book: BookResponse = {
    id: 10,
    title: 'Good Omens',
    authors: ['George Orwell', 'Aldous Huxley'],
    isbn: 'isbn-1',
    publishedYear: 1990,
    genre: 'Fantasy',
    rating: null,
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [{ provide: BooksService, useValue: service }],
    }).compile();

    controller = module.get<BooksController>(BooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findAll with query filters', async () => {
    service.findAll.mockResolvedValue([book]);
    const query = { genre: 'Dystopian' };

    await expect(controller.findAll(query)).resolves.toEqual([book]);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates create', async () => {
    const dto = {
      title: 'Good Omens',
      authors: ['George Orwell', 'Aldous Huxley'],
      isbn: 'isbn-1',
      publishedYear: 1990,
      genre: 'Fantasy',
    };
    service.create.mockResolvedValue(book);

    await expect(controller.create(dto)).resolves.toEqual(book);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findOne', async () => {
    service.findOne.mockResolvedValue(book);

    await expect(controller.findOne(10)).resolves.toEqual(book);
    expect(service.findOne).toHaveBeenCalledWith(10);
  });

  it('delegates update', async () => {
    const dto = {
      title: 'Good Omens',
      authors: ['George Orwell'],
      isbn: 'isbn-1',
      publishedYear: 1991,
    };
    service.update.mockResolvedValue(book);

    await expect(controller.update(10, dto)).resolves.toEqual(book);
    expect(service.update).toHaveBeenCalledWith(10, dto);
  });

  it('delegates remove', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(10)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(10);
  });
});
