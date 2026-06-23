import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Author } from '../src/authors/author.entity';
import { AuthorsModule } from '../src/authors/authors.module';
import { Book } from '../src/books/book.entity';
import { BooksModule } from '../src/books/books.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

/**
 * Builds a fully wired NestJS application backed by an isolated in-memory
 * SQLite database, mirroring the production bootstrap (global prefix,
 * ValidationPipe, exception filter) so e2e tests exercise real behavior.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        dropSchema: true,
        entities: [Author, Book],
        synchronize: true,
      }),
      AuthorsModule,
      BooksModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  return app;
}
