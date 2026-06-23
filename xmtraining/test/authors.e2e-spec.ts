import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './test-app';

describe('Authors (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  describe('POST /api/authors', () => {
    it('creates an author (201)', async () => {
      const res = await request(server())
        .post('/api/authors')
        .send({ name: 'Jane Austen', nationality: 'British', birthYear: 1775 })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(Number),
        name: 'Jane Austen',
        nationality: 'British',
        birthYear: 1775,
        books: [],
      });
    });

    it('rejects a missing name (400) with the ErrorResponse shape', async () => {
      const res = await request(server())
        .post('/api/authors')
        .send({ nationality: 'British' })
        .expect(400);

      expect(res.body).toEqual({
        error: expect.any(String),
        message: expect.any(String),
        status: 400,
      });
    });

    it('rejects a name longer than 255 chars (400)', async () => {
      await request(server())
        .post('/api/authors')
        .send({ name: 'a'.repeat(256) })
        .expect(400);
    });

    it('rejects unknown properties (400)', async () => {
      await request(server())
        .post('/api/authors')
        .send({ name: 'Valid', unexpected: true })
        .expect(400);
    });
  });

  describe('GET /api/authors', () => {
    it('returns the list of authors (200)', async () => {
      await request(server())
        .post('/api/authors')
        .send({ name: 'Mary Shelley' })
        .expect(201);

      const res = await request(server()).get('/api/authors').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          books: expect.any(Array),
        }),
      );
    });
  });

  describe('GET /api/authors/:id', () => {
    it('returns an author by id (200)', async () => {
      const created = await request(server())
        .post('/api/authors')
        .send({ name: 'Leo Tolstoy' })
        .expect(201);

      const res = await request(server())
        .get(`/api/authors/${created.body.id}`)
        .expect(200);

      expect(res.body).toEqual({
        id: created.body.id,
        name: 'Leo Tolstoy',
        nationality: null,
        birthYear: null,
        books: [],
      });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(server())
        .get('/api/authors/999999')
        .expect(404);

      expect(res.body).toEqual({
        error: expect.any(String),
        message: expect.any(String),
        status: 404,
      });
    });
  });

  describe('GET /api/authors/:id/books', () => {
    it('returns the books for an author (200)', async () => {
      const author = await request(server())
        .post('/api/authors')
        .send({ name: 'Frank Herbert' })
        .expect(201);

      await request(server())
        .post('/api/books')
        .send({
          title: 'Dune',
          authors: ['Frank Herbert'],
          isbn: 'isbn-dune',
          publishedYear: 1965,
          genre: 'Sci-Fi',
        })
        .expect(201);

      const res = await request(server())
        .get(`/api/authors/${author.body.id}/books`)
        .expect(200);

      expect(res.body).toEqual([
        expect.objectContaining({
          title: 'Dune',
          authors: ['Frank Herbert'],
          isbn: 'isbn-dune',
        }),
      ]);
    });

    it('lists a multi-author book under each of its authors (200)', async () => {
      const a1 = await request(server())
        .post('/api/authors')
        .send({ name: 'Brian Kernighan' })
        .expect(201);
      const a2 = await request(server())
        .post('/api/authors')
        .send({ name: 'Dennis Ritchie' })
        .expect(201);

      await request(server())
        .post('/api/books')
        .send({
          title: 'The C Programming Language',
          authors: ['Brian Kernighan', 'Dennis Ritchie'],
          isbn: 'isbn-c-lang',
          publishedYear: 1978,
        })
        .expect(201);

      const books1 = await request(server())
        .get(`/api/authors/${a1.body.id}/books`)
        .expect(200);
      const books2 = await request(server())
        .get(`/api/authors/${a2.body.id}/books`)
        .expect(200);

      expect(books1.body).toEqual([
        expect.objectContaining({
          title: 'The C Programming Language',
          authors: ['Brian Kernighan', 'Dennis Ritchie'],
        }),
      ]);
      expect(books2.body).toEqual([
        expect.objectContaining({
          title: 'The C Programming Language',
          authors: ['Brian Kernighan', 'Dennis Ritchie'],
        }),
      ]);
    });

    it('returns 404 for an unknown author', async () => {
      await request(server()).get('/api/authors/999999/books').expect(404);
    });
  });
});
