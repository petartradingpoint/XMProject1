import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { AuthorResponse } from './dto/author-response.dto';

describe('AuthorsController', () => {
  let controller: AuthorsController;
  let service: jest.Mocked<
    Pick<AuthorsService, 'findAll' | 'create' | 'findOne' | 'findBooks'>
  >;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findBooks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [{ provide: AuthorsService, useValue: service }],
    }).compile();

    controller = module.get<AuthorsController>(AuthorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findAll to the service', async () => {
    const authors: AuthorResponse[] = [
      { id: 1, name: 'A', nationality: null, birthYear: null, books: [] },
    ];
    service.findAll.mockResolvedValue(authors);

    await expect(controller.findAll()).resolves.toEqual(authors);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('delegates create to the service', async () => {
    const dto = { name: 'George Orwell' };
    const created: AuthorResponse = {
      id: 1,
      name: 'George Orwell',
      nationality: null,
      birthYear: null,
      books: [],
    };
    service.create.mockResolvedValue(created);

    await expect(controller.create(dto)).resolves.toEqual(created);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findOne to the service', async () => {
    const author: AuthorResponse = {
      id: 7,
      name: 'A',
      nationality: null,
      birthYear: null,
      books: [],
    };
    service.findOne.mockResolvedValue(author);

    await expect(controller.findOne(7)).resolves.toEqual(author);
    expect(service.findOne).toHaveBeenCalledWith(7);
  });

  it('delegates findBooks to the service', async () => {
    service.findBooks.mockResolvedValue([]);

    await expect(controller.findBooks(7)).resolves.toEqual([]);
    expect(service.findBooks).toHaveBeenCalledWith(7);
  });
});
